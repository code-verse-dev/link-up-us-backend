const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    memberId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    businessName: { type: String, required: true },
    industry: { type: String, default: "" },
    region: { type: String, required: true },
    clusterId: { type: Schema.Types.ObjectId, ref: "Cluster" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    referralCode: { type: String, default: "NONE" },
    databaseSize: { type: Number },
    residualEarnings: { type: Number },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    partnerBannerUrl: { type: String },
    stripeCustomerId: { type: String },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
