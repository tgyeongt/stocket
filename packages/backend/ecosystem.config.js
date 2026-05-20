// PM2 프로세스 설정 (EC2 배포용)
// 실행: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "stocket-backend",
      script: "dist/index.js",
      cwd: "/home/ubuntu/stocket/packages/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: "/home/ubuntu/stocket/packages/backend/.env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
