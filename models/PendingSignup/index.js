const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pendingSignupSchema = new Schema(
  {
    signupId: { type: String, required: true, unique: true },
    clusterId: { type: Schema.Types.ObjectId, ref: "Cluster", required: true },
    email: { type: String, required: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    databaseSize: { type: Number, default: 0 },
    referralCode: { type: String, default: "NONE" },
  },
  { timestamps: true }
);

pendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
