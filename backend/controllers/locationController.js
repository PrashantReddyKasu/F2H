const User = require("../models/User")
const Order = require("../models/Order")
const socketModule = require("../socket")

// Update user's location
exports.updateLocation = async (req, res) => {
  try {
    const { longitude, latitude, address } = req.body

    console.log("Received location update:", { longitude, latitude, address, userId: req.user.id })

    if (!longitude || !latitude) {
      return res.status(400).json({ message: "Longitude and latitude are required" })
    }

    // Convert to numbers to ensure proper storage
    const lng = Number.parseFloat(longitude)
    const lat = Number.parseFloat(latitude)

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ message: "Longitude and latitude must be valid numbers" })
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Latitude must be between -90 and 90 degrees" })
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Longitude must be between -180 and 180 degrees" })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user's location
    user.location = {
      type: "Point",
      coordinates: [lng, lat],
      address: address || user.location.address,
      lastUpdated: new Date(),
    }

    await user.save()

    // If user is a delivery partner, emit location update to relevant customers
    if (req.user.role === "partner") {
      // Find orders assigned to this delivery partner
      const assignedOrders = await Order.find({
        assignedTo: req.user.id,
        status: { $in: ["processing", "shipped"] },
      }).select("customer")

      // Emit location update to each customer
      assignedOrders.forEach((order) => {
        socketModule.getIO().to(order.customer.toString()).emit("delivery_location_update", {
          orderId: order._id,
          partnerId: req.user.id,
          partnerName: user.name,
          location: user.location,
        })
      })
    }

    res.json({ message: "Location updated successfully", location: user.location })
  } catch (error) {
    console.error("Update location error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Add a new endpoint to get the current user's location
exports.getUserLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("location")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ location: user.location })
  } catch (error) {
    console.error("Get user location error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get nearby farmers (for customers)
exports.getNearbyFarmers = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50000 } = req.query // maxDistance in meters, default 50km

    if (!longitude || !latitude) {
      return res.status(400).json({ message: "Longitude and latitude are required" })
    }

    const nearbyFarmers = await User.find({
      role: "farmer",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          $maxDistance: Number.parseInt(maxDistance),
        },
      },
    }).select("name location")

    res.json(nearbyFarmers)
  } catch (error) {
    console.error("Get nearby farmers error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get delivery partner location for a specific order
exports.getDeliveryPartnerLocation = async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is authorized to view this order
    if (req.user.role === "customer" && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    if (!order.assignedTo) {
      return res.status(404).json({ message: "No delivery partner assigned to this order" })
    }

    const partner = await User.findById(order.assignedTo).select("name location")
    if (!partner) {
      return res.status(404).json({ message: "Delivery partner not found" })
    }

    res.json({
      partnerId: partner._id,
      partnerName: partner.name,
      location: partner.location,
    })
  } catch (error) {
    console.error("Get delivery partner location error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
