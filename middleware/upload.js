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

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PNG, JPG, GIF, WebP allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const createSingleUpload = (fieldName, uploadKind) => (req, res, next) => {
  req.uploadKind = uploadKind;
  upload.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ status: false, message: err.message, data: {} });
    next();
  });
};

exports.uploadBanner = createSingleUpload("banner", "banner");
exports.uploadAvatar = createSingleUpload("avatar", "avatar");
