const mongoose = require("mongoose")

const bundleDealRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  offeredPrice: {
    type: Number,
    min: 0,
  },
  counterPrice: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "counter", "expired"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
})

const BundleDealRequest = mongoose.model("BundleDealRequest", bundleDealRequestSchema)

module.exports = BundleDealRequest
