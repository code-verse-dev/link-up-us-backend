const express = require("express");
const { getMe, updateMe } = require("../../controllers/users");
const { userRoute } = require("../../middleware");

const router = express.Router();

router.get("/me", userRoute, getMe);
router.patch("/me", userRoute, updateMe);

module.exports = router;
