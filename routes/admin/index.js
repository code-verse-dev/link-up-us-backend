const express = require("express");
const { adminRoute } = require("../../middleware/adminAuth");

const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/dashboard", require("./dashboard"));
router.use("/users", adminRoute, require("./users"));
router.use("/subscriptions", adminRoute, require("./subscriptions"));
router.use("/invoices", adminRoute, require("./invoices"));
router.use("/referrals", adminRoute, require("./referrals"));
router.use("/marketplace", adminRoute, require("./marketplace"));
router.use("/partners", adminRoute, require("./partners"));
router.use("/templates", adminRoute, require("./templates"));
router.use("/tiers", adminRoute, require("./tiers"));
router.use("/training", adminRoute, require("./training"));

module.exports = router;
