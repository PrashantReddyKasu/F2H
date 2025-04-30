import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Don't set Content-Type for FormData (multipart/form-data)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default api
