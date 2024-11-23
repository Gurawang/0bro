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

// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
