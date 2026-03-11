const express = require("express");
const { getSubscription, listInvoices, createCheckoutSession } = require("../../controllers/billing");
const { userRoute } = require("../../middleware");

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);

router.get("/subscription", userRoute, getSubscription);
router.get("/invoices", userRoute, listInvoices);

module.exports = router;
