const express = require("express")
const router = express.Router()
const cartController = require("../controllers/cartController")
const { authenticate, authorize } = require("../middleware/auth")

// All cart routes require customer authentication
router.use(authenticate, authorize(["customer"]))

// Get cart
router.get("/", cartController.getCart)

// Add item to cart
router.post("/items", cartController.addToCart)

// Update cart item
router.put("/items", cartController.updateCartItem)

// Remove item from cart
router.delete("/items/:itemId", cartController.removeFromCart)

// Clear cart
router.delete("/", cartController.clearCart)

// Update cart item by request ID
router.put("/items/request", cartController.updateCartItemByRequest)

module.exports = router
