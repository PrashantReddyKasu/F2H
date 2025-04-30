const express = require("express")
const router = express.Router()
const profileController = require("../controllers/profileController")
const { authenticate } = require("../middleware/auth")

// All routes require authentication
router.use(authenticate)

// Get user profile
router.get("/", profileController.getProfile)

// Update user profile (name, phone, address)
router.put("/", profileController.updateProfile)

// Update profile picture
router.put("/picture", profileController.upload.single("profilePicture"), profileController.updateProfilePicture)

// Update password
router.put("/password", profileController.updatePassword)

// Update email
router.put("/email", profileController.updateEmail)

module.exports = router
