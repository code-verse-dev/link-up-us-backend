const express = require("express");
const { list } = require("../../controllers/admin/invoices");

const router = express.Router();

router.get("/", list);

module.exports = router;
