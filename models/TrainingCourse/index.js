const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trainingCourseSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingCourse", trainingCourseSchema);
