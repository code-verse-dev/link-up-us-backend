const express = require("express");
const {
  login,
  register,
  completeSignup,
  forgotPassword,
  resetPassword,
} = require("../../controllers/auth");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/complete-signup", completeSignup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
