const mongoose = require("mongoose")

const priceMatchRequestSchema = new mongoose.Schema({
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
  competitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Changed from "User" to "Product"
    required: true,
  },
  competitorPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "expired"],
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

const PriceMatchRequest = mongoose.model("PriceMatchRequest", priceMatchRequestSchema)

module.exports = PriceMatchRequest
