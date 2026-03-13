const express = require("express");
const { list, summary } = require("../../controllers/referrals");

const router = express.Router();

router.get("/", list);
router.get("/summary", summary);

module.exports = router;
