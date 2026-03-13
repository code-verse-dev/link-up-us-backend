const express = require("express");
const { getMe, updateMe, listMembers } = require("../../controllers/users");
const { userRoute } = require("../../middleware");

const router = express.Router();

router.get("/me", userRoute, getMe);
router.patch("/me", userRoute, updateMe);
router.get("/members/list", userRoute, listMembers);

module.exports = router;
