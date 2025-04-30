const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    enum: ["kg", "g", "lb", "oz", "piece", "bunch", "dozen"],
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Vegetables",
      "Fruits",
      "Dairy",
      "Meat",
      "Grains",
      "Herbs & Spices",
      "Nuts & Seeds",
      "Honey & Preserves",
      "Baked Goods",
      "Other",
    ],
    default: "Other",
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
})

// Create index for similar product search
// Remove any existing text index and create a new one on the name field only
productSchema.index({ name: "text" })

// Remove any existing unique index on title field if it exists
// This will be done in a separate MongoDB command

const Product = mongoose.model("Product", productSchema)

module.exports = Product
