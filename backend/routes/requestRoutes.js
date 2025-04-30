const express = require("express")
const router = express.Router()
const requestController = require("../controllers/requestController")
const { authenticate, authorize } = require("../middleware/auth")

// Create requests (requires authentication and customer role)
router.post("/bargain", authenticate, authorize(["customer"]), requestController.createBargainRequest)
router.post("/bundle", authenticate, authorize(["customer"]), requestController.createBundleDealRequest)
router.post("/price-match", authenticate, authorize(["customer"]), requestController.createPriceMatchRequest)

// Get requests
router.get("/farmer", authenticate, authorize(["farmer"]), requestController.getFarmerRequests)
router.get("/customer", authenticate, authorize(["customer"]), requestController.getCustomerRequests)

// Handle bargain requests (requires authentication and farmer role)
router.post("/bargain/accept", authenticate, authorize(["farmer"]), requestController.acceptBargainRequest)
router.post("/bargain/reject", authenticate, authorize(["farmer"]), requestController.rejectBargainRequest)

// Handle bundle deal requests (requires authentication and farmer role)
router.post("/bundle/accept", authenticate, authorize(["farmer"]), requestController.acceptBundleDealRequest)
router.post("/bundle/reject", authenticate, authorize(["farmer"]), requestController.rejectBundleDealRequest)
router.post("/bundle/counter", authenticate, authorize(["farmer"]), requestController.counterBundleDealRequest)

// Handle price match requests (requires authentication and farmer role)
router.post("/price-match/accept", authenticate, authorize(["farmer"]), requestController.acceptPriceMatchRequest)
router.post("/price-match/reject", authenticate, authorize(["farmer"]), requestController.rejectPriceMatchRequest)

module.exports = router
