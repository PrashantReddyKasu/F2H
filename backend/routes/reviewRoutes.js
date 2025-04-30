const express = require("express")
const router = express.Router()
const reviewController = require("../controllers/reviewController")
const { authenticate, authorize } = require("../middleware/auth")

// Create a new review (requires authentication and customer role)
router.post("/", authenticate, authorize(["customer"]), reviewController.createReview)

// Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews)

// Get reviews by a customer
router.get("/customer", authenticate, authorize(["customer"]), reviewController.getCustomerReviews)

// Check if a customer can review a product
router.get("/can-review/:productId/:orderId", authenticate, authorize(["customer"]), reviewController.canReviewProduct)

// Update a review
router.put("/:id", authenticate, authorize(["customer"]), reviewController.updateReview)

// Delete a review
router.delete("/:id", authenticate, authorize(["customer"]), reviewController.deleteReview)

module.exports = router
