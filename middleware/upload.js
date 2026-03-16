const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "Uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const kind = req.uploadKind || "file";
    const name = `${kind}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PNG, JPG, GIF, WebP allowed"), false);
};

const videoFilter = (req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only MP4, WebM, MOV allowed"), false);
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 300 * 1024 * 1024 },
});

const createSingleUpload = (fieldName, uploadKind) => (req, res, next) => {
  req.uploadKind = uploadKind;
  upload.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ status: false, message: err.message, data: {} });
    next();
  });
};

const createVideoUpload = (fieldName, uploadKind) => (req, res, next) => {
  req.uploadKind = uploadKind;
  uploadVideo.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ status: false, message: err.message, data: {} });
    next();
  });
};

exports.uploadBanner = createSingleUpload("banner", "banner");
exports.uploadAvatar = createSingleUpload("avatar", "avatar");
exports.uploadLogo = createSingleUpload("logo", "logo");
exports.uploadThumbnail = createSingleUpload("thumbnail", "thumb");
exports.uploadVideoFile = createVideoUpload("video", "video");
