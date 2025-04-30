const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  specialPrice: {
    type: Number,
    min: 0,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    // This can reference any request type (bargain, bundle, price match)
  },
  requestType: {
    type: String,
    enum: ["bargain", "bundle", "priceMatch"],
    // Making it optional by not including 'required: true'
  },
})

const cartSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field on save
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

const Cart = mongoose.model("Cart", cartSchema)

module.exports = Cart
