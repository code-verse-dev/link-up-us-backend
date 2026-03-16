const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    status: { type: String, enum: ["active", "past_due", "canceled"], default: "active" },
    currentPeriodEnd: { type: Date },
    referralDiscountApplied: { type: Boolean, default: false },
    stripeSubscriptionId: { type: String },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
