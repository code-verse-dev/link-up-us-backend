const express = require("express");
const { links, linkDetails, list } = require("../../controllers/admin/referrals");

const router = express.Router();

router.get("/links", links);
router.get("/links/:userId", linkDetails);
router.get("/", list);

module.exports = router;
