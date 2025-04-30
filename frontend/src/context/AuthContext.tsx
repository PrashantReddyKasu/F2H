"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import api from "../services/api"

interface User {
  _id: string
  name: string
  email: string
  role: "customer" | "farmer" | "partner"
  address?: string
  phoneNumber?: string
  profilePicture?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<User>
  updateProfilePicture: (file: File) => Promise<User>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateEmail: (email: string, password: string) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token")

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await api.get("/auth/me")
          setUser(response.data)
          setIsAuthenticated(true)

          // Store user ID in localStorage for components that need it
          localStorage.setItem("userId", response.data._id)
          console.log("User authenticated:", response.data)
        } catch (error) {
          console.error("Authentication error:", error)
          localStorage.removeItem("token")
          localStorage.removeItem("userId")
          delete api.defaults.headers.common["Authorization"]
        }
      }

      setLoading(false)
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("userId", user._id)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      setIsAuthenticated(true)
      console.log("Login successful:", user)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await api.post("/auth/register", { name, email, password, role })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("userId", user._id)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put("/profile", data)
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  const updateProfilePicture = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("profilePicture", file)

      const response = await api.put("/profile/picture", formData)
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error("Update profile picture error:", error)
      throw error
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.put("/profile/password", { currentPassword, newPassword })
    } catch (error) {
      console.error("Update password error:", error)
      throw error
    }
  }

  const updateEmail = async (email: string, password: string) => {
    try {
      const response = await api.put("/profile/email", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("userId", user._id)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      return user
    } catch (error) {
      console.error("Update email error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateProfilePicture,
        updatePassword,
        updateEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
