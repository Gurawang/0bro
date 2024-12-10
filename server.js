const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Firebase Admin 초기화
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

// 미들웨어 설정
app.use(cors({ origin: ['https://www.dokdolove.com'], optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '10mb' })); // 요청 본문 크기를 최대 10MB로 설정

// 공통 함수: Firestore에서 사용자 데이터 로드
async function getUserData(userId) {
    const doc = await db.collection('settings').doc(userId).get();
    if (!doc.exists) {
        throw new Error('사용자 데이터를 찾을 수 없습니다.');
    }
    return doc.data();
}

// Firestore에서 사용자 WordPress 데이터 로드
async function getWordPressCredentials(userId) {
    const doc = await db.collection('settings').doc(userId).collection('wordpress').doc('wordpress').get();
    if (!doc.exists) {
        throw new Error('WordPress 데이터를 찾을 수 없습니다.');
    }
    return doc.data();
}

// Gemini 프록시 엔드포인트
app.post('/proxy/gemini', async (req, res) => {
    const { userId, apiKey, requestData } = req.body;

    // 요청 데이터 검증
    if (!userId || !apiKey || !requestData || !requestData.prompt || !requestData.model) {
        return res.status(400).json({ success: false, error: '요청 데이터가 누락되었습니다.' });
    }

    try {
        // Gemini API 호출
        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/generateText',
            {
                model: requestData.model,
                prompt: requestData.prompt,
                temperature: requestData.temperature || 0.7,
                top_p: requestData.top_p || 0.9,
                max_output_tokens: requestData.max_output_tokens || 1000,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        // 성공 응답 반환
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Gemini API 호출 오류:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                success: false,
                error: error.response.data,
            });
        } else {
            res.status(500).json({ success: false, error: 'Gemini API 호출 중 서버 오류' });
        }
    }
});






// 워드프레스 블로그 포스팅 프록시
app.post('/proxy/wp-post', async (req, res) => {
    const { userId, blogUrl, username, appPassword, postData } = req.body;

    if (!userId || !blogUrl || !username || !appPassword || !postData) {
        return res.status(400).json({ success: false, error: '요청 데이터가 누락되었습니다.' });
    }

    try {
        const response = await axios.post(
            `${blogUrl}/wp-json/wp/v2/posts`,
            {
                title: postData.title,
                content: postData.content,
                status: 'publish',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
                },
            }
        );

        res.status(response.status).json({ success: true, data: response.data });
    } catch (error) {
        console.error('워드프레스 포스팅 오류:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                success: false,
                error: error.response.data,
            });
        } else {
            res.status(500).json({ success: false, error: '서버 오류' });
        }
    }
});






// 구글 블로그 포스팅 프록시
app.post('/proxy/google-blog', async (req, res) => {
    const { userId, postData } = req.body;

    if (!userId || !postData || !postData.title || !postData.content) {
        return res.status(400).json({ error: '요청 데이터가 누락되었습니다.' });
    }

    try {
        const userData = await getUserData(userId);
        const { blogId, googleApiKey } = userData.googleBlogCredentials || {};

        if (!blogId || !googleApiKey) {
            return res.status(400).json({ error: '구글 블로그 크리덴셜이 설정되지 않았습니다.' });
        }

        const response = await axios.post(
            `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
            {
                kind: 'blogger#post',
                title: postData.title,
                content: postData.content,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${googleApiKey}`,
                },
            }
        );

        res.status(response.status).json({ success: true, data: response.data });
    } catch (error) {
        console.error('구글 블로그 포스팅 오류:', error.message);
        if (error.response) {
            console.error('응답 데이터:', error.response.data);
            res.status(error.response.status).json({ success: false, error: error.response.data });
        } else {
            res.status(500).json({ success: false, error: '구글 블로그 포스팅 오류' });
        }
    }
});




// 유효성 검증을 위한 공통 함수
async function validateApiKey({ endpoint, headers, params }) {
    try {
        const response = await axios.get(endpoint, { headers, params });
        return response.status === 200;
    } catch (error) {
        console.error(`API 호출 오류: ${error.message}`);
        return false;
    }
}

// 예시: OpenAI API 프록시
app.get('/api/openai/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`Received OpenAI API request for userId: ${userId}`);
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.openAIKey;

        if (!apiKey) return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });

        const isValid = await validateApiKey({
            endpoint: 'https://api.openai.com/v1/models',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        res.json({ ok: isValid });
    } catch (error) {
        console.error(`OpenAI API 호출 오류: ${error.message}`);
        res.status(500).json({ ok: false, error: 'OpenAI API 호출 오류' });
    }
});

app.get('/api/gemini/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.geminiKey;

        if (!apiKey) return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });

        const isValid = await validateApiKey({
            endpoint: 'https://api.gemini.com/v1/pubticker/btcusd',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        res.json({ ok: isValid });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Gemini API 호출 오류' });
    }
});

app.get('/api/googleimage/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.googleImageApiKey;
        const cx = doc.data()?.googleImageCx;

        if (!apiKey || !cx) return res.status(400).json({ error: 'API 키 또는 CX가 설정되지 않았습니다.' });

        const isValid = await validateApiKey({
            endpoint: 'https://www.googleapis.com/customsearch/v1',
            params: { key: apiKey, cx, q: 'test' }
        });

        res.json({ ok: isValid });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Google Image API 호출 오류' });
    }
});

app.get('/api/cloudinary/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = doc.data() || {};

        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret)
            return res.status(400).json({ error: 'Cloudinary 설정이 부족합니다.' });

        const auth = Buffer.from(`${cloudinaryApiKey}:${cloudinaryApiSecret}`).toString('base64');
        const isValid = await validateApiKey({
            endpoint: `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/resources/image`,
            headers: { 'Authorization': `Basic ${auth}` }
        });

        res.json({ ok: isValid });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Cloudinary API 호출 오류' });
    }
});

app.get('/api/pixabay/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.pixabayApiKey;

        if (!apiKey) return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });

        const isValid = await validateApiKey({
            endpoint: `https://pixabay.com/api/`,
            params: { key: apiKey, q: 'test' }
        });

        res.json({ ok: isValid });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Pixabay API 호출 오류' });
    }
});

app.get('/api/coupang/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const { coupangApiKey, coupangApiSecret } = doc.data() || {};

        if (!coupangApiKey || !coupangApiSecret)
            return res.status(400).json({ error: '쿠팡 API 키가 설정되지 않았습니다.' });

        const auth = `CEA ${coupangApiKey}:${coupangApiSecret}`;
        const isValid = await validateApiKey({
            endpoint: 'https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink',
            headers: { 'Authorization': auth, 'Content-Type': 'application/json;charset=UTF-8' }
        });

        res.json({ ok: isValid });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Coupang API 호출 오류' });
    }
});

// 딜레이 함수
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


// 포스팅 생성 API
app.post('/api/generate-post', async (req, res) => {
    const { userId, settings } = req.body;

    if (!userId || !settings) {
        return res.status(400).json({ success: false, error: '요청 데이터가 누락되었습니다.' });
    }

    try {
        const jobId = `${userId}-${Date.now()}`;
        await db.collection('posting-jobs').doc(jobId).set({
            userId,
            settings,
            status: '진행 중',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const keywords = settings.keywords || [];
        if (settings.postingOption.auto) {
            await handleAutoPosting(jobId, userId, settings, keywords);
        } else if (settings.postingOption.schedule) {
            await handleScheduledPosting(jobId, userId, settings);
        } else {
            await handleSinglePosting(jobId, userId, settings, keywords[0]);
        }

        await db.collection('posting-jobs').doc(jobId).update({ status: '완료' });
        res.json({ success: true, jobId });
    } catch (error) {
        console.error('작업 처리 중 오류:', error.message);
        res.status(500).json({ success: false, error: '작업 처리 실패' });
    }
});

// 주요 작업 처리 함수
// 단일 포스팅 처리
async function handleSinglePosting(jobId, userId, settings, keyword) {
    const topic = await resolvePostTopic(settings, keyword);
    const postData = await generatePostData(userId, settings, topic);
    const blogCredentials = await fetchBlogCredentials(userId, settings.blogSelection);

    await postToBlog(settings.blogSelection, blogCredentials, postData);
    await updatePostHistory(userId, postData);
}

// 연속 포스팅 처리
async function handleAutoPosting(jobId, userId, settings, keywords) {
    for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        const topic = await resolvePostTopic(settings, keyword);
        const postData = await generatePostData(userId, settings, topic);
        const blogCredentials = await fetchBlogCredentials(userId, settings.blogSelection);

        await postToBlog(settings.blogSelection, blogCredentials, postData);
        await updatePostHistory(userId, postData);

        if (i < keywords.length - 1 && settings.timeButtonType === 'custom') {
            const intervalMs = parseInt(settings.customInterval, 10) * 1000;
            await delay(intervalMs);
        }
    }
}

// 예약 포스팅 처리
async function handleScheduledPosting(jobId, userId, settings) {
    const { year, month, day, hour, minute } = settings.schedule;
    const scheduleTime = new Date(year, month - 1, day, hour, minute);

    const delayMs = scheduleTime.getTime() - Date.now();
    if (delayMs > 0) {
        await delay(delayMs);
    }

    const topic = await resolvePostTopic(settings, settings.keywords[0]);
    const postData = await generatePostData(userId, settings, topic);
    const blogCredentials = await fetchBlogCredentials(userId, settings.blogSelection);

    await postToBlog(settings.blogSelection, blogCredentials, postData);
    await updatePostHistory(userId, postData);
}

// 주요 Helper 함수
// 주제 생성
async function resolvePostTopic(settings, keyword) {
    switch (settings.topicSelection) {
        case 'realTimeKeyword':
            const response = await axios.get('https://www.dokdolove.com/api/realtime-keywords');
            return response.data.keywords?.[0] || '기본 주제';
        case 'manualTopic':
            return keyword || '기본 주제';
        case 'rssCrawl':
            const rssResponse = await axios.get(`https://www.dokdolove.com/api/rss-crawl?url=${settings.rssInput}`);
            return rssResponse.data.extractedContent || '기본 주제';
        default:
            throw new Error('유효하지 않은 주제 선택 옵션입니다.');
    }
}

// 프롬프트 생성
function resolvePrompt(topic, settings) {
    return settings.promptSelection === 'defaultPrompt'
        ? `다음 주제에 대한 블로그 글을 작성하세요: ${topic}`
        : settings.customPrompt.replace('{{topic}}', topic);
}

// AI 콘텐츠 생성
async function generatePostContent(prompt, settings) {
    const aiConfig = {
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: settings.aiSelection,
    };

    const requestData = {
        model: aiConfig.model,
        messages: [
            { role: 'system', content: '당신은 훌륭한 블로그 글 작성가입니다.' },
            { role: 'user', content: `언어: ${settings.language}\n문체: ${settings.tone}\n${settings.emojiToggle ? '이모티콘 포함' : ''}\n내용:\n${prompt}` },
        ],
        max_tokens: 1000,
        temperature: 0.7,
    };

    const response = await axios.post(aiConfig.apiUrl, requestData, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    return response.data.choices[0].message.content.trim();
}

// 이미지 처리
async function processImages(settings, topic) {
    if (!settings.useImage) return [];
    if (settings.imageOption === 'search') {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: { q: topic, cx: settings.imageSearchCx, key: settings.imageSearchApiKey },
        });
        return response.data.items.map((item) => ({ url: item.link, source: item.displayLink }));
    }
    return settings.uploadedImages || [];
}

// 블로그 포스팅 함수
// 블로그 포스팅
async function postToBlog(blogSelection, blogCredentials, postData) {
    try {
        if (blogSelection === 'wordpress') {
            const response = await axios.post(`${blogCredentials.siteUrl}/wp-json/wp/v2/posts`, {
                title: postData.title,
                content: postData.content,
                status: 'publish',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${blogCredentials.username}:${blogCredentials.appPassword}`).toString('base64')}`,
                },
            });
            return response.data;
        } else if (blogSelection === 'googleBlog') {
            const response = await axios.post(
                `https://www.googleapis.com/blogger/v3/blogs/${blogCredentials.blogId}/posts/`,
                {
                    kind: 'blogger#post',
                    title: postData.title,
                    content: postData.content,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${blogCredentials.googleApiKey}`,
                    },
                }
            );
            return response.data;
        } else {
            throw new Error('지원하지 않는 블로그 플랫폼입니다.');
        }
    } catch (error) {
        console.error('블로그 포스팅 오류:', error.message);
        throw new Error('블로그 포스팅 중 오류가 발생했습니다.');
    }
}

// 작업 이력 저장
async function updatePostHistory(userId, postData) {
    try {
        const historyRef = db.collection('postHistory').doc(userId).collection('posts');
        await historyRef.add({
            title: postData.title,
            content: postData.content,
            images: postData.images,
            ads: postData.ads,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error('작업 이력 저장 오류:', error.message);
        throw new Error('작업 이력을 저장하는 중 오류가 발생했습니다.');
    }
}

// 기타 Helper 함수
// 광고 생성
function generateAds(settings) {
    const ads = [];
    if (settings.useCoupangAds && settings.coupangLink) {
        ads.push(`<a href="${settings.coupangLink}" target="_blank">쿠팡 광고</a>`);
    }
    if (settings.useAdSenseAds) {
        ads.push('<div>Google AdSense 광고 배너</div>'); // AdSense 광고 예제
    }
    return ads.join('\n');
}

// 이미지 HTML 생성
function generateImageHTML(images, showImageSource) {
    return images.map((img) => `
        <img src="${img.url}" alt="이미지" style="max-width:100%; height:auto;" />
        ${showImageSource && img.source ? `<p>출처: ${img.source}</p>` : ''}
    `).join('\n');
}

// 최종 포스팅 데이터 생성
async function generatePostData(userId, settings, topic) {
    const prompt = resolvePrompt(topic, settings);
    const content = await generatePostContent(prompt, settings);
    const images = await processImages(settings, topic);
    const ads = generateAds(settings);

    const finalContent = `${content}\n\n${generateImageHTML(images, settings.showImageSource)}\n\n${ads}`;

    return {
        title: topic,
        content: finalContent,
        images,
        ads,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
}

// 블로그 자격 증명 가져오기
async function fetchBlogCredentials(userId, blogSelection) {
    if (blogSelection === 'wordpress') {
        const wordpressSnapshot = await db.collection('settings').doc(userId).collection('wordpress').get();
        if (!wordpressSnapshot.empty) {
            return wordpressSnapshot.docs[0].data();
        }
    } else if (blogSelection === 'googleBlog') {
        const googleSnapshot = await db.collection('settings').doc(userId).collection('googleBlog').get();
        if (!googleSnapshot.empty) {
            return googleSnapshot.docs[0].data();
        }
    }
    throw new Error('블로그 자격 증명을 가져올 수 없습니다.');
}

// 예약 작업 API
async function handleScheduledPosting(jobId, userId, settings) {
    const { year, month, day, hour, minute } = settings.schedule;
    const scheduleTime = new Date(year, month - 1, day, hour, minute);
    const delayMs = scheduleTime.getTime() - Date.now();

    if (delayMs > 0) {
        await delay(delayMs);
    }

    const topic = await resolvePostTopic(settings, settings.keywords[0]);
    const postData = await generatePostData(userId, settings, topic);
    const blogCredentials = await fetchBlogCredentials(userId, settings.blogSelection);

    await postToBlog(settings.blogSelection, blogCredentials, postData);
    await updatePostHistory(userId, postData);
}



// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
