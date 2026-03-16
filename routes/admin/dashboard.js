const express = require("express");
const { stats } = require("../../controllers/admin/dashboard");
const { adminRoute } = require("../../middleware/adminAuth");

const router = express.Router();

router.get("/stats", adminRoute, stats);

module.exports = router;
