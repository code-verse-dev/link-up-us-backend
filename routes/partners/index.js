const express = require("express");
const { list, search, create, update, remove } = require("../../controllers/partners");

const router = express.Router();

router.get("/", list);
router.get("/search", search);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
