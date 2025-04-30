"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectBasedOnRole(user.role)
    }
  }, [isAuthenticated, user])

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "customer":
        navigate("/customer/dashboard")
        break
      case "farmer":
        navigate("/farmer/dashboard")
        break
      case "partner":
        navigate("/partner/dashboard")
        break
      default:
        navigate("/")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      // The useEffect will handle redirection after successful login
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-green-600 mb-6">Login to F2H</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-green-600 hover:text-green-800">
            Register
          </Link>
        </p>
      </div>

      <div className="text-center mt-4">
        <Link to="/" className="text-green-600 hover:text-green-800">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default Login
