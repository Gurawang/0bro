const express = require('express');
const axios = require('axios');

const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;


// Firebase Admin 초기화
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const db = admin.firestore();


// CORS 설정
app.use(cors({
    origin: ['https://www.dokdolove.com'],
    optionsSuccessStatus: 200,
}));

// 미들웨어 설정
app.use(express.json({ limit: '10mb' })); // 요청 본문 크기를 최대 10MB로 설정

// 공통 함수: Firestore에서 사용자 데이터 로드
async function getUserData(userId) {
    const doc = await db.collection('settings').doc(userId).get();
    if (!doc.exists) {
        throw new Error('사용자 데이터를 찾을 수 없습니다.');
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
        console.log('워드프레스 API 호출 중...');
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
                    Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`, // 기본 인증
                },
            }
        );
        console.log('워드프레스 API 응답:', response.data);

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
                    Authorization: `Bearer ${googleApiKey}`, // Google API 키 인증
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
    try {
        console.log('요청 데이터:', req.body);
        const { userId, settings, keywords } = req.body;

        if (!userId || !settings || !keywords || keywords.length === 0) {
            console.error('요청 데이터 누락:', { userId, settings, keywords });
            return res.status(400).json({ success: false, error: '요청 데이터가 누락되었습니다.' });
        }

        const { blogSelection, blogUrl, username, appPassword, googleApiKey, blogId } = settings;

        if (!blogSelection || !blogUrl) {
            return res.status(400).json({ error: '블로그 선택 정보가 없습니다.' });
        }

        console.log('선택된 블로그 플랫폼:', blogSelection);
        console.log('선택된 블로그 URL:', blogUrl);

        // customPrompt 값 확인
        if (!settings.customPrompt || settings.customPrompt.trim() === "") {
            console.error('프롬프트 내용이 없습니다.');
            return res.status(400).json({ success: false, error: '프롬프트 내용이 없습니다.' });
        }
        console.log('전달된 프롬프트 내용:', settings.customPrompt);

        // 작업 ID 생성 및 저장
        const jobId = `${userId}-${Date.now()}`;
        console.log('작업 ID:', jobId);

        await db.collection('posting-jobs').doc(jobId).set({
            userId,
            keywords,
            status: '진행 중',
            aiSelection: settings.aiSelection || 'gpt-4-turbo',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            postingOption: settings.postingOption,
            schedule: settings.schedule || null,
        });
        console.log('Firestore 작업 생성 완료');

        // AI 모델 강제 설정
        settings.aiSelection = 'gpt-4-turbo';
        console.log('AI 모델 설정:', settings.aiSelection);

        // 포스팅 옵션에 따라 처리
        if (settings.postingOption.auto) {
            console.log('연속 포스팅 작업 시작:', { jobId, userId, settings, keywords });
            if (!keywords || keywords.length === 0) {
                throw new Error('연속 포스팅을 위한 키워드가 누락되었습니다.');
            }
            await handleAutoPosting(jobId, userId, settings, keywords);
        } else if (settings.postingOption.schedule) {
            console.log('예약 포스팅 작업 시작:', { jobId, userId, settings });
            if (!settings.schedule || !settings.schedule.year || !settings.schedule.month || !settings.schedule.day) {
                throw new Error('예약 포스팅을 위한 일정 정보가 누락되었습니다.');
            }
            await handleScheduledPosting(jobId, userId, settings);
        } else {
            console.log('단일 포스팅 작업 시작:', { jobId, userId, settings, keyword: keywords[0] });
            if (!keywords || !keywords[0]) {
                throw new Error('단일 포스팅을 위한 키워드가 누락되었습니다.');
            }
            await handleSinglePosting(jobId, userId, settings, keywords[0]);
        }

        // 작업 완료 업데이트
        await db.collection('posting-jobs').doc(jobId).update({ status: '완료' });
        console.log('작업 완료');
        res.json({ success: true, jobId });
    } catch (error) {
        console.error('작업 처리 중 오류:', {
            message: error.message,
            stack: error.stack,
            data: req.body,
        });
        res.status(500).json({ success: false, error: error.message || '작업 처리 실패' });
    }
});



// 주요 작업 처리 함수
// 단일 포스팅 처리
async function handleSinglePosting(jobId, userId, settings, keyword) {
    try {
        console.log(`[단일 포스팅] 키워드: ${keyword}`);
        const topic = await resolvePostTopic(settings, keyword);
        const postData = await generatePostData(userId, settings, topic);

        console.log('[단일 포스팅] 포스팅 데이터:', postData);

        // 통합 포스팅 함수 호출
        await handlePosting(userId, settings.blogSelection, settings.blogUrl, postData);

        await updatePostHistory(userId, postData);
    } catch (error) {
        console.error('[단일 포스팅 오류]:', error.message);
        throw error;
    }
}


// 연속 포스팅 처리
async function handleAutoPosting(jobId, userId, settings, keywords) {
    for (let i = 0; i < keywords.length; i++) {
        try {
            const keyword = keywords[i];
            console.log(`[연속 포스팅 ${i + 1}/${keywords.length}] 키워드: ${keyword}`);

            const topic = await resolvePostTopic(settings, keyword);
            console.log(`[연속 포스팅] 생성된 주제: ${topic}`);

            const postData = await generatePostData(userId, settings, topic);
            console.log(`[연속 포스팅] 생성된 포스팅 데이터:`, postData);

            // 통합 포스팅 함수 호출
            await handlePosting(userId, settings.blogSelection, settings.blogUrl, postData);

            console.log(`[연속 포스팅 ${i + 1}/${keywords.length}] 포스팅 완료`);

            await updatePostHistory(userId, postData);

            if (i < keywords.length - 1 && settings.timeButtonType === 'custom') {
                const intervalMs = parseInt(settings.customInterval, 10) * 1000;
                console.log(`다음 포스팅까지 ${intervalMs / 1000}초 대기 중...`);
                await delay(intervalMs);
            }
        } catch (error) {
            console.error(`[연속 포스팅 오류 ${i + 1}/${keywords.length}]:`, error.message);
            continue; // 다음 키워드로 진행
        }
    }
}

// 예약 포스팅 처리
async function handleScheduledPosting(jobId, userId, settings) {
    try {
        const { year, month, day, hour, minute } = settings.schedule;
        const scheduleTime = new Date(year, month - 1, day, hour, minute);

        const delayMs = scheduleTime.getTime() - Date.now();
        if (delayMs > 0) {
            console.log(`예약 포스팅 대기 중: ${delayMs / 1000}초`);
            await delay(delayMs);
        }

        const topic = await resolvePostTopic(settings, settings.keywords[0]);
        console.log('[예약 포스팅] 생성된 주제:', topic);

        const postData = await generatePostData(userId, settings, topic);
        console.log('[예약 포스팅] 생성된 포스팅 데이터:', postData);

        // 통합 포스팅 함수 호출
        await handlePosting(userId, settings.blogSelection, settings.blogUrl, postData);

        console.log('[예약 포스팅] 포스팅 완료');

        await updatePostHistory(userId, postData);
    } catch (error) {
        console.error('[예약 포스팅 오류]:', error.message);
        throw error;
    }
}


// WordPress 포스팅 함수
async function postToWordPress(blogUrl, username, appPassword, postData) {
    try {
        console.log('WordPress 포스팅 요청 데이터 확인:');
        console.log('Blog URL:', blogUrl);
        console.log('Username:', username);
        console.log('App Password:', appPassword);
        console.log('Post Data:', postData);

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

        console.log('WordPress 포스팅 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('WordPress 포스팅 오류:', error.message);

        if (error.response) {
            console.error('응답 상태 코드:', error.response.status);
            console.error('응답 데이터:', error.response.data);
        } else {
            console.error('네트워크 또는 서버 오류:', error.message);
        }

        throw error;
    }
}

// Google Blog 포스팅 함수
async function postToGoogleBlog(blogId, clientId, clientSecret, refreshToken, postData) {
    try {
        console.log('Google Blog 포스팅 요청 데이터 확인:');
        console.log('Blog ID:', blogId);
        console.log('Access Token 생성을 위한 Client ID:', clientId);

        // Access Token 생성
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        const accessToken = tokenResponse.data.access_token;

        console.log('생성된 Access Token:', accessToken);

        // Google Blog API 호출
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
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log('Google Blog 포스팅 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('Google Blog 포스팅 오류:', error.message);

        if (error.response) {
            console.error('응답 상태 코드:', error.response.status);
            console.error('응답 데이터:', error.response.data);
        } else {
            console.error('네트워크 또는 서버 오류:', error.message);
        }

        throw error;
    }
}

// 포스팅 실행 함수
async function handlePosting(userId, blogSelection, blogUrl, postData) {
    try {
        console.log("포스팅 실행 함수 시작");
        console.log("User ID:", userId);
        console.log("Blog Selection:", blogSelection);
        console.log("Blog URL:", blogUrl);
        console.log("Post Data:", postData);


        if (blogSelection === 'wordpress') {

            console.log("WordPress 포스팅 데이터 확인:");
            console.log("Blog URL:", settings.blogUrl);
            console.log("Username:", settings.username);
            console.log("App Password:", settings.appPassword);

            await postToWordPress(settings.blogUrl, settings.username, settings.appPassword, postData);

        } else if (blogSelection === 'googleBlog') {
 

            console.log("Google Blog 포스팅 데이터 확인:");
            console.log("Blog ID:", settings.blogId);
            console.log("Client ID:", settings.clientId);
            console.log("Client Secret:", settings.clientSecret);
            console.log("Refresh Token:", settings.refreshToken);

            await postToGoogleBlog(settings.blogId, settings.clientId, settings.clientSecret, settings.refreshToken, postData);

        } else {
            console.error("지원하지 않는 블로그 플랫폼:", blogSelection);
            throw new Error('지원하지 않는 블로그 플랫폼입니다.');
        }

        console.log(`[포스팅 성공] 플랫폼: ${blogSelection}`);
    } catch (error) {
        console.error(`[포스팅 실패] 플랫폼: ${blogSelection}, 에러: ${error.message}`);
        throw error;
    }
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
    if (settings.promptSelection === 'defaultPrompt') {
        return `다음 주제에 대한 블로그 글을 작성하세요: ${topic}`;
    }
    if (settings.customPrompt) {
        return settings.customPrompt.replace('{{topic}}', topic);
    }
    throw new Error('프롬프트 데이터가 누락되었습니다.');
}


// AI 콘텐츠 생성
async function generatePostContent(userId, prompt, settings) {
    try {
        const userDoc = await db.collection('settings').doc(userId).get();
        const openAIKey = userDoc.data()?.openAIKey;

        if (!openAIKey) {
            throw new Error('OpenAI API 키가 누락되었습니다.');
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: settings.aiSelection,
            messages: [
                { role: 'system', content: '당신은 훌륭한 블로그 글 작성가입니다.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 1000,
            temperature: 0.7,
        }, {
            headers: { Authorization: `Bearer ${openAIKey}` },
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('AI 콘텐츠 생성 중 오류:', error.message);
        throw error;
    }
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
    try {
        console.log('포스팅 데이터 생성 시작');

        // 프롬프트 생성
        const prompt = resolvePrompt(topic, settings);
        console.log('생성된 프롬프트:', prompt);

        // AI 콘텐츠 생성
        const content = await generatePostContent(userId, prompt, settings); // userId 전달
        console.log('생성된 콘텐츠:', content);

        // 이미지 처리
        const images = await processImages(settings, topic);
        console.log('처리된 이미지:', images);

        // 광고 생성
        const ads = generateAds(settings);
        console.log('생성된 광고:', ads);

        // 최종 데이터 반환
        return {
            title: topic,
            content: `${content}\n\n${generateImageHTML(images, settings.showImageSource)}\n\n${ads}`,
            images,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
    } catch (error) {
        console.error('포스팅 데이터 생성 중 오류:', error);
        throw error;
    }
}


// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
