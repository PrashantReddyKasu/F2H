const Review = require("../models/Review")
const Product = require("../models/Product")
const Order = require("../models/Order")

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body

    // Validate input
    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if order exists and belongs to the customer
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to review this order" })
    }

    // Check if order is delivered (can only review delivered orders)
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Can only review products from delivered orders" })
    }

    // Check if product exists in the order
    const productInOrder = order.items.some((item) => item.product.toString() === productId)
    if (!productInOrder) {
      return res.status(400).json({ message: "Product not found in this order" })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      product: productId,
      order: orderId,
      customer: req.user.id,
    })

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product for this order" })
    }

    // Create new review
    const review = new Review({
      product: productId,
      order: orderId,
      customer: req.user.id,
      rating: Number(rating),
      comment,
    })

    await review.save()

    // Update product average rating
    await updateProductRating(productId)

    res.status(201).json(review)
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("customer", "name profileImage")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    console.error("Get product reviews error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get reviews by a customer
exports.getCustomerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user.id })
      .populate("product", "name image")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    console.error("Get customer reviews error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body

    // Find review and check ownership
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    // Check if user is the reviewer
    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this review" })
    }

    // Update review
    review.rating = Number(rating) || review.rating
    review.comment = comment || review.comment
    await review.save()

    // Update product average rating
    await updateProductRating(review.product)

    res.json(review)
  } catch (error) {
    console.error("Update review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    // Find review and check ownership
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    // Check if user is the reviewer or an admin
    if (review.customer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" })
    }

    const productId = review.product

    await Review.findByIdAndDelete(req.params.id)

    // Update product average rating
    await updateProductRating(productId)

    res.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Delete review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Helper function to update product average rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId })

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0,
      })
      return
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    await Product.findByIdAndUpdate(productId, {
      averageRating: averageRating.toFixed(1),
      reviewCount: reviews.length,
    })
  } catch (error) {
    console.error("Update product rating error:", error)
    throw error
  }
}

// Check if a customer can review a product
exports.canReviewProduct = async (req, res) => {
  try {
    const { productId, orderId } = req.params

    // Check if order exists and belongs to the customer
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to review this order" })
    }

    // Check if order is delivered
    if (order.status !== "delivered") {
      return res.json({ canReview: false, reason: "Order not delivered yet" })
    }

    // Check if product exists in the order
    const productInOrder = order.items.some((item) => item.product.toString() === productId)
    if (!productInOrder) {
      return res.json({ canReview: false, reason: "Product not found in this order" })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      product: productId,
      order: orderId,
      customer: req.user.id,
    })

    if (existingReview) {
      return res.json({
        canReview: false,
        reason: "Already reviewed",
        existingReview,
      })
    }

    res.json({ canReview: true })
  } catch (error) {
    console.error("Can review product error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
