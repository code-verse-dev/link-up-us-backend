module.exports = {
  apps: [
    {
      name: "link-up-us",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "customdev",
      },
    },
  ],
};
