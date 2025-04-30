const express = require("express")
const router = express.Router()
const locationController = require("../controllers/locationController")
const { authenticate, authorize } = require("../middleware/auth")

// All routes require authentication
router.use(authenticate)

// Update user's location (all users)
router.post("/update", locationController.updateLocation)

// Get nearby farmers (for customers)
router.get("/nearby-farmers", authorize(["customer"]), locationController.getNearbyFarmers)

// Get delivery partner location for a specific order
router.get("/delivery/:orderId", authorize(["customer"]), locationController.getDeliveryPartnerLocation)

// Get current user's location
router.get("/user", locationController.getUserLocation)

module.exports = router
