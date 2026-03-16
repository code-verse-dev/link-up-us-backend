const express = require("express");
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
  updateProfile,
  uploadAvatar,
} = require("../../controllers/admin/auth");
const { adminRoute } = require("../../middleware/adminAuth");
const { uploadAvatar: uploadAvatarMw } = require("../../middleware/upload");

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", adminRoute, changePassword);
router.get("/me", adminRoute, me);
router.patch("/profile", adminRoute, updateProfile);
router.post("/avatar", adminRoute, uploadAvatarMw, uploadAvatar);

module.exports = router;
