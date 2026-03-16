const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trainingSectionSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "TrainingCourse", required: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingSection", trainingSectionSchema);
