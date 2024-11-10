const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
const corsOptions = {
    origin: 'https://www.dokdolove.com',
    optionsSuccessStatus: 200
};
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

app.use(cors(corsOptions));
app.use(express.json());

// OpenAI API 프록시
app.get('/api/openai/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.openAIKey;

        if (!apiKey) {
            console.log('OpenAI API 키가 설정되지 않았습니다.');
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
            console.log('Gemini API 키가 설정되지 않았습니다.');
            return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        // Gemini 엔드포인트 예시로 대체
        const response = await axios.get('https://api.gemini.com/v1/pubticker/btcusd', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Gemini API 호출 오류:", error.response ? error.response.data : error.message);
        res.status(500).json({ ok: false, error: 'Gemini API 호출 오류' });
    }
});

// Google Image API 프록시
app.get('/api/googleimage/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const doc = await db.collection('settings').doc(userId).get();
        const apiKey = doc.data()?.googleImageApiKey;
        const cx = doc.data()?.googleCx; // Custom Search 엔진 ID

        if (!apiKey || !cx) {
            console.log('Google Image API 키 또는 cx가 설정되지 않았습니다.');
            return res.status(400).json({ error: 'API 키 또는 cx가 설정되지 않았습니다.' });
        }

        const response = await axios.get(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test`);
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Google Image API 호출 오류:", error.response ? error.response.data : error.message);
        res.status(500).json({ ok: false, error: 'Google Image API 호출 오류' });
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
            console.log('Google Image API 키 또는 CX가 설정되지 않았습니다.');
            return res.status(400).json({ error: 'API 키 또는 CX가 설정되지 않았습니다.' });
        }

        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: apiKey,
                cx: cx,
                q: 'test'
            }
        });

        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Google Image API 호출 오류:", error.response ? error.response.data : error.message);
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
            console.log('Cloudinary 설정이 부족합니다.');
            return res.status(400).json({ error: 'Cloudinary 설정이 부족합니다.' });
        }

        const auth = Buffer.from(`${cloudinaryApiKey}:${cloudinaryApiSecret}`).toString('base64');
        const response = await axios.get(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/resources/image`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Cloudinary API 호출 오류:", error.message);
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
            console.log('Pixabay API 키가 설정되지 않았습니다.');
            return res.status(400).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        const response = await axios.get(`https://pixabay.com/api/?key=${apiKey}&q=test`);
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Pixabay API 호출 오류:", error.message);
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
            console.log('Coupang API 키가 설정되지 않았습니다.');
            return res.status(400).json({ error: '쿠팡 API 키가 설정되지 않았습니다.' });
        }

        const auth = `CEA ${coupangApiKey}:${coupangApiSecret}`;
        const response = await axios.get('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink', {
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json;charset=UTF-8'
            }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Coupang API 호출 오류:", error.message);
        res.status(500).json({ ok: false, error: 'Coupang API 호출 오류' });
    }
});


app.listen(PORT, () => {
    console.log(`프록시 서버가 ${process.env.DOMAIN}:${PORT}에서 실행 중입니다.`);
});
