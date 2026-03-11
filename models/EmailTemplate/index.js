const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const templateSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    previewUrl: { type: String },
    htmlFile: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailTemplate", templateSchema);
