const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = 443;

const sslOptions = {
    key: fs.readFileSync('./www_dokdolove.com.key'),
    cert: fs.readFileSync('./www_dokdolove.com_cert.crt')
};

const corsOptions = {
    origin: ['https://www.dokdolove.com'],
    optionsSuccessStatus: 200
};

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
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/api/validate/:service/:userId', async (req, res) => {
    const { service, userId } = req.params;
    const doc = await db.collection('settings').doc(userId).get();
    const data = doc.data();

    try {
        let response;
        switch (service) {
            case 'openai':
                if (!data?.openAIKey) throw new Error('API 키 없음');
                response = await axios.get('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${data.openAIKey}` }
                });
                break;
            case 'gemini':
                if (!data?.geminiKey) throw new Error('API 키 없음');
                response = await axios.get('https://api.gemini.com/v1/pubticker/btcusd', {
                    headers: { 'Authorization': `Bearer ${data.geminiKey}` }
                });
                break;
            case 'googleimage':
                if (!data?.googleImageApiKey || !data?.googleImageCx) throw new Error('API 키 또는 CX 없음');
                response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                    params: { key: data.googleImageApiKey, cx: data.googleImageCx, q: 'test' }
                });
                break;
            case 'cloudinary':
                if (!data?.cloudinaryCloudName || !data?.cloudinaryApiKey || !data?.cloudinaryApiSecret) throw new Error('설정 없음');
                const auth = Buffer.from(`${data.cloudinaryApiKey}:${data.cloudinaryApiSecret}`).toString('base64');
                response = await axios.get(`https://api.cloudinary.com/v1_1/${data.cloudinaryCloudName}/resources/image`, {
                    headers: { 'Authorization': `Basic ${auth}` }
                });
                break;
            case 'pixabay':
                if (!data?.pixabayApiKey) throw new Error('API 키 없음');
                response = await axios.get(`https://pixabay.com/api/?key=${data.pixabayApiKey}&q=test`);
                break;
            case 'coupang':
                if (!data?.coupangApiKey || !data?.coupangApiSecret) throw new Error('API 키 또는 비밀키 없음');
                const coupangAuth = `CEA ${data.coupangApiKey}:${data.coupangApiSecret}`;
                response = await axios.get('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink', {
                    headers: { 'Authorization': coupangAuth, 'Content-Type': 'application/json;charset=UTF-8' }
                });
                break;
            default:
                throw new Error('알 수 없는 서비스');
        }
        res.json({ ok: response.status === 200 });
    } catch (error) {
        res.status(500).json({ ok: false, error: `${service} API 키 유효성 오류` });
    }
});

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HTTPS 서버가 https://www.dokdolove.com에서 실행 중입니다.`);
});
