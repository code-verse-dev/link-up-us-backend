const express = require("express");
const { verifyMember } = require("../../controllers/verify");

const router = express.Router();

router.get("/member", verifyMember);
router.post("/member", verifyMember);

module.exports = router;
