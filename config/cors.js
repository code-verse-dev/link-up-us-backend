const allowedOrigins = new Set([
  "link-up.us",
  "localhost",
  "127.0.0.1",
]);

const headers = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "x-user-id",
];

const { NODE_ENV } = process.env;

const corsOptions = {
  origin: (origin, callback) =>
    !origin || [...allowedOrigins].some((d) => origin.includes(d)) || NODE_ENV === "development"
      ? callback(null, true)
      : callback(new Error("Not allowed by CORS")),
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  optionsSuccessStatus: 204,
  credentials: true,
  allowedHeaders: headers,
  exposedHeaders: headers,
};

module.exports = corsOptions;
