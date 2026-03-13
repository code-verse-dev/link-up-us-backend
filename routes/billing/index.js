const express = require("express");
const { getConfig, getSubscription, listInvoices, createCheckoutSession, createSubscription } = require("../../controllers/billing");
const { userRoute } = require("../../middleware");

const router = express.Router();

router.get("/config", getConfig);
router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-subscription", createSubscription);

router.get("/subscription", userRoute, getSubscription);
router.get("/invoices", userRoute, listInvoices);

module.exports = router;

