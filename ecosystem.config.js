module.exports = {
    apps: [{
        name: "server",
        script: "./server.js", // 서버의 진입점 파일 경로
        env: {
            PORT: 5000 // Express 서버에서 사용할 포트를 명시
        },
        instances: 1, // 여러 개의 인스턴스를 사용하지 않고 하나만 실행
        autorestart: true, // 서버가 꺼졌을 때 자동 재시작
        watch: false // 코드 변경 감지 시 자동 재시작 비활성화
    }]
};
