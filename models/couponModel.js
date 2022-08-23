const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
  },
  description: {
    type: String,
  },
  percentage: {
    type: Number,
    required: true,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Coupon", couponSchema);
