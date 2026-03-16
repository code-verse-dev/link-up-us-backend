const User = require("../../models/User");
const { ApiResponse } = require("../../helpers");
const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

/** GET /api/admin/invoices — list invoices (optionally by userId). If no Stripe, return empty. */
exports.list = async (req, res) => {
  try {
    const userId = req.query.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    if (!stripe) {
      return res.json(ApiResponse({ invoices: [], message: "Stripe not configured" }, "OK", true));
    }

    if (userId) {
      const user = await User.findById(userId).select("stripeCustomerId email name businessName").lean();
      if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
      if (!user.stripeCustomerId) {
        return res.json(ApiResponse({ invoices: [], user: { email: user.email, businessName: user.businessName } }, "OK", true));
      }
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit,
      });
      const list = (invoices.data || []).map((inv) => ({
        id: inv.id,
        date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        amount: inv.amount_paid != null ? inv.amount_paid / 100 : null,
        status: inv.status,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      }));
      return res.json(ApiResponse({ invoices: list, user: { email: user.email, businessName: user.businessName } }, "OK", true));
    }

    const invoices = await stripe.invoices.list({ limit });
    const list = (invoices.data || []).map((inv) => ({
      id: inv.id,
      customerId: inv.customer,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      amount: inv.amount_paid != null ? inv.amount_paid / 100 : null,
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }));
    return res.json(ApiResponse({ invoices: list }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
