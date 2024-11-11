const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = 5000;

// SSL 인증서 옵션 설정
const sslOptions = {
    key: fs.readFileSync('./www_dokdolove.com.key'),
    cert: fs.readFileSync('./www_dokdolove.com_cert.crt')
};

// CORS 설정
const corsOptions = {
    origin: ['https://www.dokdolove.com', 'http://localhost:5000'],
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
app.options('*', cors(corsOptions)); // 모든 OPTIONS 요청에 대해 CORS 허용
app.use(express.json());

// OpenAI API 프록시
app.get('/api/openai/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.openAIKey;

        if (!apiKey) {
            return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("OpenAI API 호출 오류:", error.message);
        res.status(500).json({ ok: false, error: 'OpenAI API 호출 오류' });
    }
});

// Gemini API 프록시
app.get('/api/gemini/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.geminiKey;

        if (!apiKey) {
            return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        const response = await axios.get('https://api.gemini.com/v1/pubticker/btcusd', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Gemini API 호출 오류' });
    }
});

// Google Image API 프록시
app.get('/api/googleimage/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.googleImageApiKey;
        const cx = doc.data()?.googleImageCx;

        if (!apiKey || !cx) {
            return res.status(400).json({ error: 'API 키 또는 CX가 설정되지 않았습니다.' });
        }

        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: { key: apiKey, cx: cx, q: 'test' }
        });

        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Google Image API 호출 오류' });
    }
});

// Cloudinary API 프록시
app.get('/api/cloudinary/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = doc.data() || {};

        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
            return res.status(400).json({ error: 'Cloudinary 설정이 부족합니다.' });
        }

        const auth = Buffer.from(`${cloudinaryApiKey}:${cloudinaryApiSecret}`).toString('base64');
        const response = await axios.get(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/resources/image`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Cloudinary API 호출 오류' });
    }
});

// Pixabay API 프록시
app.get('/api/pixabay/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.pixabayApiKey;

        if (!apiKey) {
            return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        const response = await axios.get(`https://pixabay.com/api/?key=${apiKey}&q=test`);
        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Pixabay API 호출 오류' });
    }
});

// Coupang API 프록시
app.get('/api/coupang/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const { coupangApiKey, coupangApiSecret } = doc.data() || {};

        if (!coupangApiKey || !coupangApiSecret) {
            return res.status(400).json({ error: '쿠팡 API 키가 설정되지 않았습니다.' });
        }

        const auth = `CEA ${coupangApiKey}:${coupangApiSecret}`;
        const response = await axios.get('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink', {
            headers: { 'Authorization': auth, 'Content-Type': 'application/json;charset=UTF-8' }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Coupang API 호출 오류' });
    }
});

// HTTPS 서버 실행
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HTTPS 서버가 https://www.dokdolove.com:${PORT}에서 실행 중입니다.`);
});