const express = require("express");
const {
  login,
  register,
  completeSignup,
} = require("../../controllers/auth");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/complete-signup", completeSignup);

module.exports = router;
