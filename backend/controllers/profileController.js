const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
const multer = require("multer")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/profiles")

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "profile-" + uniqueSuffix + ext)
  },
})

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"), false)
  }
}

exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
})

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update user profile (name, phone, address)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update fields
    if (name) user.name = name
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber
    if (address !== undefined) user.address = address

    await user.save()

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select("-password")
    res.json(updatedUser)
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, "..", user.profilePicture.replace(/^\//, ""))
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath)
      }
    }

    // Set new profile picture path (relative to server root)
    const relativePath = `/uploads/profiles/${req.file.filename}`
    user.profilePicture = relativePath
    await user.save()

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select("-password")
    res.json(updatedUser)
  } catch (error) {
    console.error("Update profile picture error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Update password error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update email
exports.updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" })
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" })
    }

    // Update email
    user.email = email
    await user.save()

    // Generate new token with updated email
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "f2h-secret-key", {
      expiresIn: "7d",
    })

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select("-password")
    res.json({ token, user: updatedUser })
  } catch (error) {
    console.error("Update email error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
