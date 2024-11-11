const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000; // Caddy에서 프록시할 포트

// CORS 설정
const corsOptions = {
    origin: ['https://www.dokdolove.com'],
    optionsSuccessStatus: 200
};

// Firebase Admin 초기화
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// 미들웨어 설정
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// 유효성 검증을 위한 공통 함수
async function validateApiKey({ endpoint, headers, params }) {
    try {
        const response = await axios.get(endpoint, { headers, params });

        // JSON 응답인지 확인
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            return response.status === 200;
        } else {
            console.error("Unexpected content type:", contentType);
            return false;
        }
    } catch (error) {
        console.error("API 호출 오류:", error.message);
        return false;
    }
}

// 각 API 엔드포인트 설정
app.get('/api/openai/:userId', async (req, res) => {
    const userId = req.params.userId;
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

// HTTP 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
