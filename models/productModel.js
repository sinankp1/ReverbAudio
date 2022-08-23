const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  p_id: {
    type: String,
    required: true,
  },
  modelname: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
