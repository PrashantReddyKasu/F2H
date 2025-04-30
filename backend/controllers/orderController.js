const Order = require("../models/Order")
const Product = require("../models/Product")
const socketModule = require("../socket")
const Cart = require("../models/Cart")

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" })
    }

    // Calculate total amount and validate items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)

      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` })
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` })
      }

      const itemPrice = item.price || product.price
      const subtotal = itemPrice * item.quantity
      totalAmount += subtotal

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
      })

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    // Create new order
    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      totalAmount,
    })

    await order.save()

    // Populate order with customer and product details
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    // Notify farmers about the new order
    const farmerIds = [...new Set(populatedOrder.items.map((item) => item.product.farmer._id.toString()))]

    farmerIds.forEach((farmerId) => {
      socketModule.getIO().to(farmerId).emit("new_order", populatedOrder)
    })

    res.status(201).json(populatedOrder)
  } catch (error) {
    console.error("Create order error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all orders for a customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    console.error("Get customer orders error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all orders for a farmer
exports.getFarmerOrders = async (req, res) => {
  try {
    console.log("Getting orders for farmer ID:", req.user.id)

    // Find orders where at least one item has a product from this farmer
    const orders = await Order.find()
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    console.log(`Found ${orders.length} total orders`)

    // Filter orders to only include those with products from this farmer
    const farmerOrders = orders.filter((order) => {
      // Check if any item in the order has a product from this farmer
      const hasProductFromFarmer = order.items.some((item) => {
        if (!item.product || !item.product.farmer) {
          return false
        }

        const itemFarmerId = item.product.farmer._id.toString()
        const requestFarmerId = req.user.id

        console.log(`Comparing item farmer ID: ${itemFarmerId} with request farmer ID: ${requestFarmerId}`)

        return itemFarmerId === requestFarmerId
      })

      return hasProductFromFarmer
    })

    console.log(`Filtered to ${farmerOrders.length} orders for farmer ID: ${req.user.id}`)

    res.json(farmerOrders)
  } catch (error) {
    console.error("Get farmer orders error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all orders for a delivery partner
exports.getPartnerOrders = async (req, res) => {
  try {
    // Delivery partners can see all orders
    const orders = await Order.find()
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    console.error("Get partner orders error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get orders assigned to a delivery partner
exports.getPartnerAssignedOrders = async (req, res) => {
  try {
    // Find orders assigned to this delivery partner
    const orders = await Order.find({ assignedTo: req.user.id })
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    console.error("Get partner assigned orders error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get orders not assigned to any delivery partner
exports.getUnassignedOrders = async (req, res) => {
  try {
    // Find orders that are not assigned to any delivery partner
    const orders = await Order.find({
      assignedTo: null,
      status: { $in: ["pending", "processing"] },
    })
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    console.error("Get unassigned orders error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is authorized to view this order
    if (req.user.role === "customer" && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    if (req.user.role === "farmer" && !order.items.some((item) => item.product.farmer._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    res.json(order)
  } catch (error) {
    console.error("Get order by ID error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findById(req.params.id)
      .populate("customer", "name")
      .populate({
        path: "items.product",
        select: "name farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is authorized to update this order
    if (req.user.role === "customer" && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    if (req.user.role === "farmer" && !order.items.some((item) => item.product.farmer._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    // Check if status update is allowed based on user role
    if (req.user.role === "customer" && status !== "cancelled") {
      return res.status(403).json({ message: "Customers can only cancel orders" })
    }

    if (req.user.role === "farmer" && !["processing", "cancelled"].includes(status)) {
      return res.status(403).json({ message: "Farmers can only process or cancel orders" })
    }

    if (req.user.role === "partner" && !["shipped", "delivered"].includes(status)) {
      return res.status(403).json({ message: "Delivery partners can only ship or deliver orders" })
    }

    // Update order status
    order.status = status
    order.updatedAt = Date.now()
    await order.save()

    // Notify customer about status update
    socketModule.getIO().to(order.customer._id.toString()).emit("order_update", {
      _id: order._id,
      status,
    })

    // Notify farmers about status update
    const farmerIds = [...new Set(order.items.map((item) => item.product.farmer._id.toString()))]
    farmerIds.forEach((farmerId) => {
      if (farmerId !== req.user.id) {
        socketModule.getIO().to(farmerId).emit("order_update", {
          _id: order._id,
          status,
        })
      }
    })

    // Notify delivery partners about status update
    if (req.user.role !== "partner") {
      socketModule.getIO().to("partners").emit("order_update", {
        _id: order._id,
        status,
      })
    }

    res.json({ message: "Order status updated successfully", order })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Assign an order to a delivery partner
exports.assignOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if order is already assigned
    if (order.assignedTo) {
      return res.status(400).json({ message: "Order is already assigned to a delivery partner" })
    }

    // Check if order status allows assignment
    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({ message: `Cannot assign order with status: ${order.status}` })
    }

    // Assign order to this delivery partner
    order.assignedTo = req.user.id

    // If order is in pending status, update it to processing
    if (order.status === "pending") {
      order.status = "processing"
    }

    await order.save()

    // Notify customer about assignment
    socketModule.getIO().to(order.customer.toString()).emit("order_update", {
      _id: order._id,
      status: order.status,
      assignedTo: req.user.id,
    })

    res.json({ message: "Order assigned successfully", order })
  } catch (error) {
    console.error("Assign order error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Process checkout
exports.processCheckout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body

    // Validate input
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" })
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" })
    }

    // Get user's cart
    const cart = await Cart.findOne({ customer: req.user.id }).populate({
      path: "items.product",
      select: "name price unit stock farmer",
      populate: {
        path: "farmer",
        select: "name",
      },
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" })
    }

    // Calculate total amount and validate items
    let totalAmount = 0
    const orderItems = []

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id)

      if (!product) {
        return res.status(404).json({ message: `Product ${item.product.name} not found` })
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` })
      }

      const itemPrice = item.specialPrice !== undefined ? item.specialPrice : product.price
      const subtotal = itemPrice * item.quantity
      totalAmount += subtotal

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
      })

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    // Create new order
    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
    })

    await order.save()

    // Populate order with customer and product details
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email address")
      .populate({
        path: "items.product",
        select: "name price unit farmer",
        populate: {
          path: "farmer",
          select: "name",
        },
      })

    // Notify farmers about the new order
    const farmerIds = [...new Set(populatedOrder.items.map((item) => item.product.farmer._id.toString()))]

    farmerIds.forEach((farmerId) => {
      socketModule.getIO().to(farmerId).emit("new_order", populatedOrder)
    })

    // Clear the cart
    cart.items = []
    await cart.save()

    res.status(201).json(populatedOrder)
  } catch (error) {
    console.error("Checkout error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
