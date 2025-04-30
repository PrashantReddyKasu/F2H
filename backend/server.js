require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketModule = require("./socket")
const requestExpiryJob = require("./jobs/requestExpiryJob")
const path = require("path")

// Import routes
const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")
const requestRoutes = require("./routes/requestRoutes")
const orderRoutes = require("./routes/orderRoutes")
const cartRoutes = require("./routes/cartRoutes")
const profileRoutes = require("./routes/profileRoutes")
const locationRoutes = require("./routes/locationRoutes")
const reviewRoutes = require("./routes/reviewRoutes")

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = socketModule.initSocket(server)
exports.io = io

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/requests", requestRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/location", locationRoutes)
app.use("/api/reviews", reviewRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://jsunilreddy411:f2h%401234@f2h.mw4ukoj.mongodb.net/?retryWrites=true&w=majority&appName=F2H",
  )
  .then(() => {
    console.log("Connected to MongoDB")

    // Schedule request expiry jobs
    requestExpiryJob.scheduleJobs()

    // Start server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })
