const express = require("express");
const {
  list,
  get,
  create,
  update,
  updateMemberId,
  remove,
  banners,
} = require("../../controllers/admin/users");

const router = express.Router();

router.get("/", list);
router.get("/:id", get);
router.get("/:id/banners", banners);
router.post("/", create);
router.patch("/:id", update);
router.patch("/:id/member-id", updateMemberId);
router.delete("/:id", remove);

module.exports = router;
