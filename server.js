const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const https = require("https");
const http = require("http");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const env = process.env.NODE_ENV || "development";

require("dotenv").config({ path: `.env.${env}` });

const { NODE_ENV, PORT } = process.env;

let credentials = {};
if (NODE_ENV === "customdev") {
  credentials = require("./ssl");
}

const app = express();

require("./config/db");

if (!fs.existsSync(path.join(__dirname, "Uploads"))) {
  fs.mkdirSync(path.join(__dirname, "Uploads"), { recursive: true });
  console.log("Created Uploads directory");
}

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, x-user-id",
  exposedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, x-user-id",
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

const limit = "1000mb";
app.use(express.json({ limit }));
app.use(express.urlencoded({ limit, extended: true }));

let server;
if (NODE_ENV === "customdev" && credentials.key) {
  server = https.createServer(credentials, app);
} else {
  server = http.createServer(app);
}

if (process.env.SOCKET_ENABLED !== "false") {
  require("./config/socket").initializeWebSocket(server);
}

const limiter = rateLimit({
  max: 1000000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/Uploads", express.static("./Uploads"));

app.use("/api", require("./routes/index"));

app.get("/", (req, res) => {
  res.send(`Link Up Us backend running on ${NODE_ENV} mode`);
});

const port = PORT || 3045;
server.listen(port, () => {
  console.log(`Link Up Us backend listening on port ${port}`);
  const healthUrl = NODE_ENV === "customdev"
    ? "https://react.customdev.solutions/api/health"
    : `http://localhost:${port}/api/health`;
  console.log(`Health: ${healthUrl}`);
});