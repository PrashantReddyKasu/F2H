const Product = require("../models/Product")
const User = require("../models/User")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Not an image! Please upload only images."), false)
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
})

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("farmer", "name").sort({ createdAt: -1 })

    res.json(products)
  } catch (error) {
    console.error("Get all products error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("farmer", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    console.error("Get product by ID error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get similar products (same product from different farmers)
exports.getSimilarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Find products with similar name but from different farmers AND with the same unit
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      name: { $regex: new RegExp(product.name, "i") },
      farmer: { $ne: product.farmer },
      unit: product.unit, // Add this line to filter by the same unit
    })
      .populate("farmer", "name")
      .limit(5)

    res.json(similarProducts)
  } catch (error) {
    console.error("Get similar products error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get products by farmer
exports.getProductsByFarmer = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 })

    res.json(products)
  } catch (error) {
    console.error("Get products by farmer error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update the createProduct function to include category
exports.createProduct = async (req, res) => {
  try {
    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can create products" })
    }

    const { name, description, price, unit, stock, category } = req.body

    const productData = {
      name,
      description,
      price: Number.parseFloat(price),
      unit,
      stock: Number.parseInt(stock),
      category: category || "Other", // Add category with default
      farmer: req.user.id,
    }

    // Add image URL if file was uploaded
    if (req.file) {
      // Create URL for the uploaded image
      const baseUrl = `${req.protocol}://${req.get("host")}`
      productData.image = `${baseUrl}/uploads/${req.file.filename}`
    }

    const product = new Product(productData)
    await product.save()

    res.status(201).json(product)
  } catch (error) {
    console.error("Create product error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update the updateProduct function to include category
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, unit, stock, category } = req.body

    // Find product and check ownership
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if user is the farmer who created the product
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this product" })
    }

    // Update product
    product.name = name
    product.description = description
    product.price = Number.parseFloat(price)
    product.unit = unit
    product.stock = Number.parseInt(stock)
    product.category = category || product.category // Update category if provided

    // Update image if a new file was uploaded
    if (req.file) {
      // Create URL for the uploaded image
      const baseUrl = `${req.protocol}://${req.get("host")}`
      product.image = `${baseUrl}/uploads/${req.file.filename}`
    }

    await product.save()

    res.json(product)
  } catch (error) {
    console.error("Update product error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    // Find product and check ownership
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if user is the farmer who created the product
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this product" })
    }

    // If product has an image, delete it from the server
    if (product.image) {
      const imagePath = product.image.split("/uploads/")[1]
      if (imagePath) {
        const fullPath = path.join(__dirname, "../uploads", imagePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id)

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Export the upload middleware
exports.uploadProductImage = upload.single("image")

// Add a new function to get all available categories
exports.getCategories = async (req, res) => {
  try {
    // These categories should match the enum in the Product model
    const categories = [
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
    ]

    res.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Add this function to get products by a specific farmer ID
exports.getProductsByFarmerId = async (req, res) => {
  try {
    const farmerId = req.params.farmerId
    const products = await Product.find({ farmer: farmerId }).sort({ createdAt: -1 })

    res.json(products)
  } catch (error) {
    console.error("Get products by farmer ID error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
