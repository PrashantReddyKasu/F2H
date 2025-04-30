const BargainRequest = require("../models/BargainRequest")
const BundleDealRequest = require("../models/BundleDealRequest")
const PriceMatchRequest = require("../models/PriceMatchRequest")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const socketModule = require("../socket")

// Helper function to calculate expiry time (1 hour from now)
const calculateExpiryTime = () => {
  const expiryTime = new Date()
  expiryTime.setHours(expiryTime.getHours() + 1)
  return expiryTime
}

// Create a bargain request
exports.createBargainRequest = async (req, res) => {
  try {
    const { productId, farmerId, offeredPrice } = req.body

    // Validate product and farmer
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.farmer.toString() !== farmerId) {
      return res.status(400).json({ message: "Invalid farmer for this product" })
    }

    // Check if offered price is less than product price
    if (offeredPrice >= product.price) {
      return res.status(400).json({ message: "Offered price must be less than the current price" })
    }

    // Check if there's already a pending request for this product by this customer
    const existingRequest = await BargainRequest.findOne({
      customer: req.user.id,
      product: productId,
      status: "pending",
    })

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending bargain request for this product" })
    }

    // Create new bargain request
    const bargainRequest = new BargainRequest({
      customer: req.user.id,
      product: productId,
      farmer: farmerId,
      offeredPrice,
      expiresAt: calculateExpiryTime(),
    })

    await bargainRequest.save()

    // Update customer's cart with request ID
    let cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] })
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].requestId = bargainRequest._id
      cart.items[existingItemIndex].requestType = "bargain"
      // Don't set special price yet, wait for acceptance
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: 1,
        requestId: bargainRequest._id,
        requestType: "bargain",
      })
    }

    await cart.save()

    // Populate request with customer and product details for socket emission
    const populatedRequest = await BargainRequest.findById(bargainRequest._id)
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    // Emit socket event to farmer
    socketModule.getIO().to(farmerId).emit("new_request", {
      _id: populatedRequest._id,
      type: "bargain",
      status: populatedRequest.status,
      customer: populatedRequest.customer,
      product: populatedRequest.product,
      offeredPrice: populatedRequest.offeredPrice,
      createdAt: populatedRequest.createdAt,
      expiresAt: populatedRequest.expiresAt,
    })

    res.status(201).json(bargainRequest)
  } catch (error) {
    console.error("Create bargain request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Create a bundle deal request
exports.createBundleDealRequest = async (req, res) => {
  try {
    const { productId, farmerId, quantity, offeredPrice } = req.body

    // Validate product and farmer
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.farmer.toString() !== farmerId) {
      return res.status(400).json({ message: "Invalid farmer for this product" })
    }

    // Check if quantity is available
    if (quantity > product.stock) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" })
    }

    // Check if there's already a pending request for this product by this customer
    const existingRequest = await BundleDealRequest.findOne({
      customer: req.user.id,
      product: productId,
      status: "pending",
    })

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending bundle deal request for this product" })
    }

    // Create new bundle deal request
    const bundleDealRequest = new BundleDealRequest({
      customer: req.user.id,
      product: productId,
      farmer: farmerId,
      quantity,
      offeredPrice, // This can be null if customer wants farmer to suggest a price
      expiresAt: calculateExpiryTime(),
    })

    await bundleDealRequest.save()

    // Update customer's cart with request ID
    let cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] })
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity = quantity
      cart.items[existingItemIndex].requestId = bundleDealRequest._id
      cart.items[existingItemIndex].requestType = "bundle"
      // Don't set special price yet, wait for acceptance
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
        requestId: bundleDealRequest._id,
        requestType: "bundle",
      })
    }

    await cart.save()

    // Populate request with customer and product details for socket emission
    const populatedRequest = await BundleDealRequest.findById(bundleDealRequest._id)
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    // Emit socket event to farmer
    socketModule.getIO().to(farmerId).emit("new_request", {
      _id: populatedRequest._id,
      type: "bundle",
      status: populatedRequest.status,
      customer: populatedRequest.customer,
      product: populatedRequest.product,
      quantity: populatedRequest.quantity,
      offeredPrice: populatedRequest.offeredPrice,
      createdAt: populatedRequest.createdAt,
      expiresAt: populatedRequest.expiresAt,
    })

    res.status(201).json(bundleDealRequest)
  } catch (error) {
    console.error("Create bundle deal request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Create a price match request
exports.createPriceMatchRequest = async (req, res) => {
  try {
    const { productId, farmerId, competitorId, competitorPrice } = req.body

    // Validate product and farmer
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.farmer.toString() !== farmerId) {
      return res.status(400).json({ message: "Invalid farmer for this product" })
    }

    // Validate competitor product has the same unit
    const competitorProduct = await Product.findById(competitorId)
    if (!competitorProduct) {
      return res.status(404).json({ message: "Competitor product not found" })
    }

    // Check if units match
    if (product.unit !== competitorProduct.unit) {
      return res.status(400).json({
        message: "Cannot compare products with different units",
        details: `The product you selected uses ${product.unit} while the competitor product uses ${competitorProduct.unit}`,
      })
    }

    // Check if competitor price is less than product price
    if (competitorPrice >= product.price) {
      return res.status(400).json({ message: "Competitor price must be less than the current price" })
    }

    // Check if there's already a pending request for this product by this customer
    const existingRequest = await PriceMatchRequest.findOne({
      customer: req.user.id,
      product: productId,
      status: "pending",
    })

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending price match request for this product" })
    }

    // Create new price match request
    const priceMatchRequest = new PriceMatchRequest({
      customer: req.user.id,
      product: productId,
      farmer: farmerId,
      competitorId,
      competitorPrice,
      expiresAt: calculateExpiryTime(),
    })

    await priceMatchRequest.save()

    // Update customer's cart with request ID
    let cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] })
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].requestId = priceMatchRequest._id
      cart.items[existingItemIndex].requestType = "priceMatch"
      // Don't set special price yet, wait for acceptance
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: 1,
        requestId: priceMatchRequest._id,
        requestType: "priceMatch",
      })
    }

    await cart.save()

    // Populate request with customer and product details for socket emission
    const populatedRequest = await PriceMatchRequest.findById(priceMatchRequest._id)
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    // Emit socket event to farmer
    socketModule.getIO().to(farmerId).emit("new_request", {
      _id: populatedRequest._id,
      type: "priceMatch",
      status: populatedRequest.status,
      customer: populatedRequest.customer,
      product: populatedRequest.product,
      competitorPrice: populatedRequest.competitorPrice,
      createdAt: populatedRequest.createdAt,
      expiresAt: populatedRequest.expiresAt,
    })

    res.status(201).json(priceMatchRequest)
  } catch (error) {
    console.error("Create price match request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all requests for a farmer
exports.getFarmerRequests = async (req, res) => {
  try {
    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can access this endpoint" })
    }

    // Get all types of requests for this farmer
    const bargainRequests = await BargainRequest.find({ farmer: req.user.id })
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    const bundleDealRequests = await BundleDealRequest.find({ farmer: req.user.id })
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    const priceMatchRequests = await PriceMatchRequest.find({ farmer: req.user.id })
      .populate("customer", "name")
      .populate({
        path: "product",
        select: "name price unit",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    // Format requests for response
    const formattedBargainRequests = bargainRequests.map((req) => ({
      _id: req._id,
      type: "bargain",
      status: req.status,
      customer: req.customer,
      product: req.product,
      offeredPrice: req.offeredPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    const formattedBundleRequests = bundleDealRequests.map((req) => ({
      _id: req._id,
      type: "bundle",
      status: req.status,
      customer: req.customer,
      product: req.product,
      quantity: req.quantity,
      offeredPrice: req.offeredPrice,
      counterPrice: req.counterPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    const formattedPriceMatchRequests = priceMatchRequests.map((req) => ({
      _id: req._id,
      type: "priceMatch",
      status: req.status,
      customer: req.customer,
      product: req.product,
      competitorPrice: req.competitorPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    // Combine all requests
    const allRequests = [...formattedBargainRequests, ...formattedBundleRequests, ...formattedPriceMatchRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    res.json(allRequests)
  } catch (error) {
    console.error("Get farmer requests error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all requests for a customer
exports.getCustomerRequests = async (req, res) => {
  try {
    // Check if user is a customer
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can access this endpoint" })
    }

    // Get all types of requests for this customer
    const bargainRequests = await BargainRequest.find({ customer: req.user.id })
      .populate("farmer", "name")
      .populate("product", "name price unit")
      .sort({ createdAt: -1 })

    const bundleDealRequests = await BundleDealRequest.find({ customer: req.user.id })
      .populate("farmer", "name")
      .populate("product", "name price unit")
      .sort({ createdAt: -1 })

    const priceMatchRequests = await PriceMatchRequest.find({ customer: req.user.id })
      .populate("farmer", "name")
      .populate("product", "name price unit")
      .sort({ createdAt: -1 })

    // Format requests for response
    const formattedBargainRequests = bargainRequests.map((req) => ({
      _id: req._id,
      type: "bargain",
      status: req.status,
      farmer: req.farmer,
      product: req.product,
      offeredPrice: req.offeredPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    const formattedBundleRequests = bundleDealRequests.map((req) => ({
      _id: req._id,
      type: "bundle",
      status: req.status,
      farmer: req.farmer,
      product: req.product,
      quantity: req.quantity,
      offeredPrice: req.offeredPrice,
      counterPrice: req.counterPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    const formattedPriceMatchRequests = priceMatchRequests.map((req) => ({
      _id: req._id,
      type: "priceMatch",
      status: req.status,
      farmer: req.farmer,
      product: req.product,
      competitorPrice: req.competitorPrice,
      createdAt: req.createdAt,
      expiresAt: req.expiresAt,
    }))

    // Combine all requests
    const allRequests = [...formattedBargainRequests, ...formattedBundleRequests, ...formattedPriceMatchRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    res.json(allRequests)
  } catch (error) {
    console.error("Get customer requests error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Accept a bargain request
exports.acceptBargainRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const bargainRequest = await BargainRequest.findById(requestId)

    if (!bargainRequest) {
      return res.status(404).json({ message: "Bargain request not found" })
    }

    // Check if user is the farmer for this request
    if (bargainRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to accept this request" })
    }

    // Check if request is still pending
    if (bargainRequest.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${bargainRequest.status}` })
    }

    // Update request status
    bargainRequest.status = "accepted"
    await bargainRequest.save()

    // Update customer's cart with special price
    const cart = await Cart.findOne({ customer: bargainRequest.customer })
    if (cart) {
      const cartItemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === bargainRequest.product.toString() &&
          item.requestId &&
          item.requestId.toString() === bargainRequest._id.toString(),
      )

      if (cartItemIndex > -1) {
        cart.items[cartItemIndex].specialPrice = bargainRequest.offeredPrice
        await cart.save()
      }
    }

    // Emit socket event to customer
    socketModule.getIO().to(bargainRequest.customer.toString()).emit("bargain_update", {
      productId: bargainRequest.product.toString(),
      status: "accepted",
      price: bargainRequest.offeredPrice,
    })

    res.json({ message: "Bargain request accepted successfully" })
  } catch (error) {
    console.error("Accept bargain request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Reject a bargain request
exports.rejectBargainRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const bargainRequest = await BargainRequest.findById(requestId)

    if (!bargainRequest) {
      return res.status(404).json({ message: "Bargain request not found" })
    }

    // Check if user is the farmer for this request
    if (bargainRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to reject this request" })
    }

    // Check if request is still pending
    if (bargainRequest.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${bargainRequest.status}` })
    }

    // Update request status
    bargainRequest.status = "rejected"
    await bargainRequest.save()

    // Emit socket event to customer
    socketModule.getIO().to(bargainRequest.customer.toString()).emit("bargain_update", {
      productId: bargainRequest.product.toString(),
      status: "rejected",
    })

    res.json({ message: "Bargain request rejected successfully" })
  } catch (error) {
    console.error("Reject bargain request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Accept a bundle deal request
exports.acceptBundleDealRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const bundleDealRequest = await BundleDealRequest.findById(requestId)

    if (!bundleDealRequest) {
      return res.status(404).json({ message: "Bundle deal request not found" })
    }

    // Check if user is the farmer for this request
    if (bundleDealRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to accept this request" })
    }

    // Check if request is still pending
    if (bundleDealRequest.status !== "pending" && bundleDealRequest.status !== "counter") {
      return res.status(400).json({ message: `Request is already ${bundleDealRequest.status}` })
    }

    // Update request status
    bundleDealRequest.status = "accepted"
    await bundleDealRequest.save()

    // Update customer's cart with special price
    const cart = await Cart.findOne({ customer: bundleDealRequest.customer })
    if (cart) {
      const cartItemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === bundleDealRequest.product.toString() &&
          item.requestId &&
          item.requestId.toString() === bundleDealRequest._id.toString(),
      )

      if (cartItemIndex > -1) {
        // Use counter price if available, otherwise use offered price
        const specialPrice = bundleDealRequest.counterPrice || bundleDealRequest.offeredPrice
        if (specialPrice) {
          cart.items[cartItemIndex].specialPrice = specialPrice
          await cart.save()
        }
      }
    }

    // Emit socket event to customer
    socketModule
      .getIO()
      .to(bundleDealRequest.customer.toString())
      .emit("bundle_update", {
        productId: bundleDealRequest.product.toString(),
        status: "accepted",
        quantity: bundleDealRequest.quantity,
        price: bundleDealRequest.counterPrice || bundleDealRequest.offeredPrice,
      })

    res.json({ message: "Bundle deal request accepted successfully" })
  } catch (error) {
    console.error("Accept bundle deal request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Reject a bundle deal request
exports.rejectBundleDealRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const bundleDealRequest = await BundleDealRequest.findById(requestId)

    if (!bundleDealRequest) {
      return res.status(404).json({ message: "Bundle deal request not found" })
    }

    // Check if user is the farmer for this request
    if (bundleDealRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to reject this request" })
    }

    // Check if request is still pending
    if (bundleDealRequest.status !== "pending" && bundleDealRequest.status !== "counter") {
      return res.status(400).json({ message: `Request is already ${bundleDealRequest.status}` })
    }

    // Update request status
    bundleDealRequest.status = "rejected"
    await bundleDealRequest.save()

    // Emit socket event to customer
    socketModule.getIO().to(bundleDealRequest.customer.toString()).emit("bundle_update", {
      productId: bundleDealRequest.product.toString(),
      status: "rejected",
    })

    res.json({ message: "Bundle deal request rejected successfully" })
  } catch (error) {
    console.error("Reject bundle deal request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Make counter offer for a bundle deal request
exports.counterBundleDealRequest = async (req, res) => {
  try {
    const { requestId, counterPrice } = req.body

    // Find the request
    const bundleDealRequest = await BundleDealRequest.findById(requestId)

    if (!bundleDealRequest) {
      return res.status(404).json({ message: "Bundle deal request not found" })
    }

    // Check if user is the farmer for this request
    if (bundleDealRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to make counter offer for this request" })
    }

    // Check if request is still pending
    if (bundleDealRequest.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${bundleDealRequest.status}` })
    }

    // Update request with counter offer
    bundleDealRequest.counterPrice = counterPrice
    bundleDealRequest.status = "counter"
    await bundleDealRequest.save()

    // Emit socket event to customer
    socketModule.getIO().to(bundleDealRequest.customer.toString()).emit("bundle_update", {
      productId: bundleDealRequest.product.toString(),
      status: "counter",
      quantity: bundleDealRequest.quantity,
      price: counterPrice,
    })

    res.json({ message: "Counter offer sent successfully" })
  } catch (error) {
    console.error("Counter bundle deal request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Accept a price match request
exports.acceptPriceMatchRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const priceMatchRequest = await PriceMatchRequest.findById(requestId)

    if (!priceMatchRequest) {
      return res.status(404).json({ message: "Price match request not found" })
    }

    // Check if user is the farmer for this request
    if (priceMatchRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to accept this request" })
    }

    // Check if request is still pending
    if (priceMatchRequest.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${priceMatchRequest.status}` })
    }

    // Update request status
    priceMatchRequest.status = "accepted"
    await priceMatchRequest.save()

    // Update customer's cart with special price
    const cart = await Cart.findOne({ customer: priceMatchRequest.customer })
    if (cart) {
      const cartItemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === priceMatchRequest.product.toString() &&
          item.requestId &&
          item.requestId.toString() === priceMatchRequest._id.toString(),
      )

      if (cartItemIndex > -1) {
        cart.items[cartItemIndex].specialPrice = priceMatchRequest.competitorPrice
        await cart.save()
      }
    }

    // Emit socket event to customer
    socketModule.getIO().to(priceMatchRequest.customer.toString()).emit("price_match_update", {
      productId: priceMatchRequest.product.toString(),
      status: "accepted",
      price: priceMatchRequest.competitorPrice,
    })

    res.json({ message: "Price match request accepted successfully" })
  } catch (error) {
    console.error("Accept price match request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Reject a price match request
exports.rejectPriceMatchRequest = async (req, res) => {
  try {
    const { requestId } = req.body

    // Find the request
    const priceMatchRequest = await PriceMatchRequest.findById(requestId)

    if (!priceMatchRequest) {
      return res.status(404).json({ message: "Price match request not found" })
    }

    // Check if user is the farmer for this request
    if (priceMatchRequest.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to reject this request" })
    }

    // Check if request is still pending
    if (priceMatchRequest.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${priceMatchRequest.status}` })
    }

    // Update request status
    priceMatchRequest.status = "rejected"
    await priceMatchRequest.save()

    // Emit socket event to customer
    socketModule.getIO().to(priceMatchRequest.customer.toString()).emit("price_match_update", {
      productId: priceMatchRequest.product.toString(),
      status: "rejected",
    })

    res.json({ message: "Price match request rejected successfully" })
  } catch (error) {
    console.error("Reject price match request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
