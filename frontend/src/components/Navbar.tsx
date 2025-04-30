"use client"

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  // Check if we're on the homepage
  const isHomePage = location.pathname === "/"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const getDashboardLink = () => {
    if (!user) return "/"

    switch (user.role) {
      case "customer":
        return "/customer/dashboard"
      case "farmer":
        return "/farmer/dashboard"
      case "partner":
        return "/partner/dashboard"
      default:
        return "/"
    }
  }

  // If we're on the homepage and not authenticated, use a simplified navbar
  if (isHomePage && !isAuthenticated) {
    return (
      <nav className="bg-transparent text-gray-800 absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img src="/F2Hlogo.png" alt="F2H Logo" className="h-16" />
              </Link>
            </div>

            <div className="flex items-center">
              <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:text-green-600">
                Sign In
              </Link>
              <Link
                to="/register"
                className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Regular navbar for authenticated users or other pages
  return (
    <nav className="bg-green-600 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex-shrink-0 flex items-center">
              <img src="/F2Hlogo.png" alt="F2H Logo" className="h-16" />
            </Link>
          </div>

          <div className="flex items-center">
            {isAuthenticated && user ? (
              <>
                <span className="mr-4">Welcome, {user.name}</span>

                {user.role === "customer" && (
                  <>
                    <Link to="/customer/orders" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      My Orders
                    </Link>
                    <Link to="/cart" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 relative">
                      Cart
                      {cart && cart.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cart.items.length}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {user.role === "farmer" && (
                  <>
                    <Link
                      to="/farmer/dashboard"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Dashboard
                    </Link>
                    <Link to="/farmer/products" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      My Products
                    </Link>
                    <Link to="/farmer/sales" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Sales
                    </Link>
                  </>
                )}

                {user.role === "partner" && (
                  <>
                    <Link
                      to="/partner/dashboard"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/partner/deliveries"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Deliveries
                    </Link>
                    <Link to="/partner/revenue" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Revenue
                    </Link>
                  </>
                )}

                <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Profile
                </Link>

                <Link to="/location-settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Location
                </Link>

                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Login
                </Link>
                <Link to="/register" className="ml-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
