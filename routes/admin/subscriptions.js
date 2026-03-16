const express = require("express");
const { list, get, cancel, extend } = require("../../controllers/admin/subscriptions");

const router = express.Router();

router.get("/", list);
router.get("/:id", get);
router.post("/:id/cancel", cancel);
router.post("/:id/extend", extend);

module.exports = router;
