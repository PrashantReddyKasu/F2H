const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")
const { authenticate, authorize } = require("../middleware/auth")

// Create a new order (requires authentication and customer role)
router.post("/", authenticate, authorize(["customer"]), orderController.createOrder)

// Process checkout (requires authentication and customer role)
router.post("/checkout", authenticate, authorize(["customer"]), orderController.processCheckout)

// Get orders based on role
router.get("/customer", authenticate, authorize(["customer"]), orderController.getCustomerOrders)
router.get("/farmer", authenticate, authorize(["farmer"]), orderController.getFarmerOrders)
router.get("/partner", authenticate, authorize(["partner"]), orderController.getPartnerOrders)

// Add these new routes
router.get("/partner/assigned", authenticate, authorize(["partner"]), orderController.getPartnerAssignedOrders)
router.get("/partner/unassigned", authenticate, authorize(["partner"]), orderController.getUnassignedOrders)
router.put("/:id/assign", authenticate, authorize(["partner"]), orderController.assignOrder)

// Get order by ID (requires authentication)
router.get("/:id", authenticate, orderController.getOrderById)

// Update order status (requires authentication)
router.put("/:id/status", authenticate, orderController.updateOrderStatus)

// Make sure the farmer orders route is correctly defined
// This should already be correct, but let's verify:

router.get("/farmer", authenticate, authorize(["farmer"]), orderController.getFarmerOrders)

module.exports = router
