const cron = require("node-cron")
const BargainRequest = require("../models/BargainRequest")
const BundleDealRequest = require("../models/BundleDealRequest")
const PriceMatchRequest = require("../models/PriceMatchRequest")
const socketModule = require("../socket")

// Function to handle expired bargain requests
const handleExpiredBargainRequests = async () => {
  try {
    const now = new Date()

    // Find all pending bargain requests that have expired
    const expiredRequests = await BargainRequest.find({
      status: "pending",
      expiresAt: { $lt: now },
    }).populate("customer product")

    // Update status to expired
    for (const request of expiredRequests) {
      request.status = "expired"
      await request.save()

      // Notify customer
      socketModule.getIO().to(request.customer._id.toString()).emit("bargain_update", {
        productId: request.product._id.toString(),
        status: "expired",
      })

      console.log(`Expired bargain request: ${request._id}`)
    }

    if (expiredRequests.length > 0) {
      console.log(`Processed ${expiredRequests.length} expired bargain requests`)
    }
  } catch (error) {
    console.error("Error handling expired bargain requests:", error)
  }
}

// Function to handle expired bundle deal requests
const handleExpiredBundleDealRequests = async () => {
  try {
    const now = new Date()

    // Find all pending bundle deal requests that have expired
    const expiredRequests = await BundleDealRequest.find({
      status: { $in: ["pending", "counter"] },
      expiresAt: { $lt: now },
    }).populate("customer product")

    // Update status to expired
    for (const request of expiredRequests) {
      request.status = "expired"
      await request.save()

      // Notify customer
      socketModule.getIO().to(request.customer._id.toString()).emit("bundle_update", {
        productId: request.product._id.toString(),
        status: "expired",
      })

      console.log(`Expired bundle deal request: ${request._id}`)
    }

    if (expiredRequests.length > 0) {
      console.log(`Processed ${expiredRequests.length} expired bundle deal requests`)
    }
  } catch (error) {
    console.error("Error handling expired bundle deal requests:", error)
  }
}

// Function to handle expired price match requests
const handleExpiredPriceMatchRequests = async () => {
  try {
    const now = new Date()

    // Find all pending price match requests that have expired
    const expiredRequests = await PriceMatchRequest.find({
      status: "pending",
      expiresAt: { $lt: now },
    }).populate("customer product")

    // Update status to expired
    for (const request of expiredRequests) {
      request.status = "expired"
      await request.save()

      // Notify customer
      socketModule.getIO().to(request.customer._id.toString()).emit("price_match_update", {
        productId: request.product._id.toString(),
        status: "expired",
      })

      console.log(`Expired price match request: ${request._id}`)
    }

    if (expiredRequests.length > 0) {
      console.log(`Processed ${expiredRequests.length} expired price match requests`)
    }
  } catch (error) {
    console.error("Error handling expired price match requests:", error)
  }
}

// Schedule jobs to run every minute
const scheduleJobs = () => {
  // Check for expired requests every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running request expiry job...")
    await handleExpiredBargainRequests()
    await handleExpiredBundleDealRequests()
    await handleExpiredPriceMatchRequests()
  })

  console.log("Request expiry jobs scheduled")
}

module.exports = { scheduleJobs }
