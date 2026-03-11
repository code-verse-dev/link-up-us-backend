const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema(
  {
    referrerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referrerMemberId: { type: String, required: true },
    businessName: { type: String, required: true },
    region: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    discountAmount: { type: String, default: "$4.99" },
    earningsPerMonth: { type: String, default: "$5.00/mo" },
  },
  { timestamps: true }
);

referralSchema.virtual("joinDate").get(function () {
  return this.createdAt;
});
referralSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Referral", referralSchema);
