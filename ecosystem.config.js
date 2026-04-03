const { config } = require("dotenv");
const { resolve } = require("path");

const appRoot = "/var/www/colorcrush";
const parsed = config({ path: resolve(appRoot, ".env.local") }).parsed || {};

module.exports = {
  apps: [
    {
      name: "candy",
      script: ".next/standalone/server.js",
      cwd: appRoot,
      env: {
        ...parsed,
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: parsed.APP_PORT || 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: resolve(appRoot, "logs/error.log"),
      out_file: resolve(appRoot, "logs/out.log"),
      merge_logs: true,
    },
  ],
};
