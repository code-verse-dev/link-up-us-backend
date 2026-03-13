const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/templates", require("./templates"));
router.use("/training", require("./training"));
router.use("/leads", require("./leads"));
router.use("/referrals", require("./referrals"));
router.use("/verify", require("./verify"));
router.use("/plans", require("./plans"));
router.use("/billing", require("./billing"));
router.use("/upload", require("./upload"));
router.use("/clusters", require("./clusters"));
router.use("/industries", require("./industries"));
router.use("/partners", require("./partners"));
router.use("/tiers", require("./tiers"));

module.exports = router;
