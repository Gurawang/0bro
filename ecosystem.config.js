module.exports = {
    apps: [{
        name: "server",
        script: "C:\\Users\\Administrator\\0bro\\server.js", // 절대 경로로 설정
        env: {
            PORT: 5000
        },
        instances: 1,
        autorestart: true,
        watch: false
    }]
};
