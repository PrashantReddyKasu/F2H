const express = require("express")
const router = express.Router()
const productController = require("../controllers/productController")
const { authenticate, authorize } = require("../middleware/auth")

// Add this new route before the other routes
// Get all categories
router.get("/categories", productController.getCategories)

// Get all products
router.get("/", productController.getAllProducts)

// Get products by farmer (requires authentication and farmer role)
router.get("/farmer", authenticate, authorize(["farmer"]), productController.getProductsByFarmer)

// Add this route to get products by a specific farmer ID
router.get("/farmer/:farmerId", productController.getProductsByFarmerId)

// Get similar products
router.get("/similar/:id", productController.getSimilarProducts)

// Get product by ID
router.get("/:id", productController.getProductById)

// Create a new product (requires authentication and farmer role)
router.post(
  "/",
  authenticate,
  authorize(["farmer"]),
  productController.uploadProductImage,
  productController.createProduct,
)

// Update a product (requires authentication and farmer role)
router.put(
  "/:id",
  authenticate,
  authorize(["farmer"]),
  productController.uploadProductImage,
  productController.updateProduct,
)

// Delete a product (requires authentication and farmer role)
router.delete("/:id", authenticate, authorize(["farmer"]), productController.deleteProduct)

module.exports = router
