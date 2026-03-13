module.exports = {
    apps: [
      {
        name: "link-up-us",       // Name of your app in PM2
        script: "dist/index.js",      // Entry file of your Node.js app
        instances: 1,             // or "max" for cluster mode
        autorestart: true,
        watch: false,
      },
    ],
  };