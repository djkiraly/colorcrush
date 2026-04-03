require("dotenv").config({ path: ".env.local" });

module.exports = {
  apps: [
    {
      name: "candy",
      script: ".next/standalone/server.js",
      cwd: "/opt/candy",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: process.env.APP_PORT || 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/opt/candy/logs/error.log",
      out_file: "/opt/candy/logs/out.log",
      merge_logs: true,
    },
  ],
};
