const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware to authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "f2h-secret-key")

    // Find user by id
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    // Add user to request object
    req.user = user

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(401).json({ message: "Token is not valid" })
  }
}

// Middleware to check user role
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    // Convert single role to array
    if (typeof roles === "string") {
      roles = [roles]
    }

    // Check if user role is included in the roles array
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    next()
  }
}
