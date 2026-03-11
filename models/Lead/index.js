const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leadSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    offerId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

leadSchema.virtual("date").get(function () {
  return this.createdAt;
});
leadSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Lead", leadSchema);
