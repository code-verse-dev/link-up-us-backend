const fs = require("fs");
require("dotenv").config();

const { NODE_ENV } = process.env;
const credentials = {};

if (NODE_ENV === "customdev") {
  const keyPath = process.env.SSL_KEY_PATH || "/etc/apache2/ssl/onlinetestingserver.key";
  const certPath = process.env.SSL_CERT_PATH || "/etc/apache2/ssl/onlinetestingserver.crt";
  const caPath = process.env.SSL_CA_PATH || "/etc/apache2/ssl/onlinetestingserver.ca";
  try {
    credentials.key = fs.readFileSync(keyPath, "utf8");
    credentials.cert = fs.readFileSync(certPath, "utf8");
    credentials.ca = fs.readFileSync(caPath, "utf8");
  } catch (err) {
    console.warn("SSL files not found, HTTPS disabled:", err.message);
  }
}

module.exports = credentials;
