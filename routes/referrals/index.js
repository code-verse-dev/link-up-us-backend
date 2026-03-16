const express = require("express");
const { track, list, summary } = require("../../controllers/referrals");

const router = express.Router();

router.get("/track", track);
router.get("/", list);
router.get("/summary", summary);

module.exports = router;
