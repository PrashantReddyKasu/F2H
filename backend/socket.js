const socketIo = require("socket.io")
let io

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("New client connected")

    // Join a room based on user ID
    socket.on("join", (userId) => {
      socket.join(userId)
      console.log(`User ${userId} joined their room`)
    })

    // Join a room for all delivery partners
    socket.on("join_partners", () => {
      socket.join("partners")
      console.log("Delivery partner joined partners room")
    })

    // Handle location updates from delivery partners
    socket.on("update_location", (data) => {
      // Broadcast to specific rooms (e.g., customers waiting for this delivery)
      if (data.customerIds && Array.isArray(data.customerIds)) {
        data.customerIds.forEach((customerId) => {
          io.to(customerId).emit("delivery_location_update", {
            partnerId: data.partnerId,
            partnerName: data.partnerName,
            location: data.location,
            orderId: data.orderId,
          })
        })
      }
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected")
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!")
  }
  return io
}

module.exports = { initSocket, getIO }
