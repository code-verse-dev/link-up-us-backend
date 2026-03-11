const express = require("express");
const { list } = require("../../controllers/referrals");

const router = express.Router();

router.get("/", list);

module.exports = router;
