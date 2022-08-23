const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  banner_title: {
    type: String,
    required: true,
  },
  banner_subtitle: {
    type: String,
  },
});

module.exports = mongoose.model("Banner", bannerSchema);
