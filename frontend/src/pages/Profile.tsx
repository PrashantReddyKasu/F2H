"use client"

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import api from "../services/api"
import StarRating from "../components/StarRating"

const Profile = () => {
  const { user, updateProfile, updateProfilePicture, updatePassword, updateEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [activeTab, setActiveTab] = useState("profile")

  // Profile form state
  const [name, setName] = useState(user?.name || "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "")
  const [address, setAddress] = useState(user?.address || "")

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Email form state
  const [newEmail, setNewEmail] = useState(user?.email || "")
  const [emailPassword, setEmailPassword] = useState("")

  // Profile picture
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.profilePicture ? `${import.meta.env.VITE_API_URL}${user.profilePicture}` : null,
  )

  // Add these interfaces inside the component
  interface Review {
    _id: string
    rating: number
    comment: string
    createdAt: string
    product: {
      _id: string
      name: string
      image?: string
    }
  }

  // Add these state variables inside the component
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    const fetchReviews = async () => {
      if (user?.role !== "customer") return

      try {
        setLoadingReviews(true)
        const response = await api.get("/reviews/customer")
        setReviews(response.data)
      } catch (err) {
        console.error("Error fetching reviews:", err)
      } finally {
        setLoadingReviews(false)
      }
    }

    if (user) {
      fetchReviews()
    }
  }, [user])

  if (!user) {
    return <LoadingSpinner />
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      await updateProfile({ name, phoneNumber, address })
      setMessage({ type: "success", text: "Profile updated successfully" })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setLoading(false)
      return
    }

    try {
      await updatePassword(currentPassword, newPassword)
      setMessage({ type: "success", text: "Password updated successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update password",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      await updateEmail(newEmail, emailPassword)
      setMessage({ type: "success", text: "Email updated successfully" })
      setEmailPassword("")
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update email",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setLoading(true)
    setMessage({ type: "", text: "" })

    // Preview image
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      await updateProfilePicture(file)
      setMessage({ type: "success", text: "Profile picture updated successfully" })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile picture",
      })
      // Reset preview if upload fails
      setPreviewImage(user?.profilePicture ? `${import.meta.env.VITE_API_URL}${user.profilePicture}` : null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6">My Profile</h1>

      {message.text && (
        <div
          className={`${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          } border px-4 py-3 rounded mb-4`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Profile Picture Section */}
          <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {previewImage ? (
                  <img src={previewImage || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 shadow-md hover:bg-green-700"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* Tabs and Forms Section */}
          <div className="w-full md:w-2/3 p-6">
            <div className="mb-6 border-b">
              <ul className="flex flex-wrap -mb-px">
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 ${
                      activeTab === "profile"
                        ? "border-green-600 text-green-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile Information
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 ${
                      activeTab === "password"
                        ? "border-green-600 text-green-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("password")}
                  >
                    Change Password
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 ${
                      activeTab === "email"
                        ? "border-green-600 text-green-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("email")}
                  >
                    Change Email
                  </button>
                </li>
              </ul>
            </div>

            {/* Profile Information Form */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={3}
                  ></textarea>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </form>
            )}

            {/* Change Password Form */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    minLength={6}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            )}

            {/* Change Email Form */}
            {activeTab === "email" && (
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newEmail">
                    New Email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emailPassword">
                    Current Password
                  </label>
                  <input
                    id="emailPassword"
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Change Email"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {user?.role === "customer" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">My Reviews</h2>
          {loadingReviews ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">You haven't written any reviews yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0 mr-3">
                      {review.product.image ? (
                        <img
                          src={review.product.image || "/placeholder.svg"}
                          alt={review.product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center text-green-800 font-bold">
                          {review.product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{review.product.name}</h4>
                      <div className="flex items-center">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile
