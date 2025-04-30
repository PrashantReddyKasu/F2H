"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useSocket } from "../../context/SocketContext"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"

interface Request {
  _id: string
  type: "bargain" | "bundle" | "priceMatch"
  status: "pending" | "accepted" | "rejected" | "expired" | "counter"
  product: {
    _id: string
    name: string
    price: number
    unit: string
  }
  customer: {
    _id: string
    name: string
  }
  offeredPrice?: number
  quantity?: number
  competitorPrice?: number
  createdAt: string
  expiresAt: string
}

interface Product {
  _id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  image?: string
}

const FarmerDashboard = () => {
  const { socket } = useSocket()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Product[]>([])

  // For counter offers
  const [counterPrice, setCounterPrice] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const response = await api.get("/requests/farmer")
        setRequests(response.data || []) // Ensure we always have an array even if response is empty
        setError("")
      } catch (err: any) {
        setError("Failed to load requests. Please try again later.")
        console.error(err)
        // Initialize with empty array on error to prevent undefined
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products/farmer")
        setProducts(response.data || [])
      } catch (err: any) {
        console.error("Failed to load products:", err)
        // Initialize with empty array on error
        setProducts([])
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (socket) {
      // Listen for new requests
      socket.on("new_request", (data) => {
        setRequests((prev) => [data, ...prev])
      })

      // Listen for request updates
      socket.on("request_update", (data) => {
        setRequests((prev) => prev.map((req) => (req._id === data._id ? { ...req, status: data.status } : req)))
      })

      return () => {
        socket.off("new_request")
        socket.off("request_update")
      }
    }
  }, [socket])

  const handleAccept = async (requestId: string, type: string) => {
    try {
      console.log(`Accepting request: ${requestId}, type: ${type}`)

      // Convert priceMatch to price-match for the API endpoint
      const endpoint = type === "priceMatch" ? "price-match" : type

      await api.post(`/requests/${endpoint}/accept`, { requestId })
      console.log(`Request accepted: ${requestId}`)

      // Update local state
      setRequests((prev) => prev.map((req) => (req._id === requestId ? { ...req, status: "accepted" } : req)))
    } catch (err: any) {
      console.error(`Error accepting request:`, err)
      alert(err.response?.data?.message || "Failed to accept request.")
    }
  }

  const handleReject = async (requestId: string, type: string) => {
    try {
      console.log(`Rejecting request: ${requestId}, type: ${type}`)

      // Convert priceMatch to price-match for the API endpoint
      const endpoint = type === "priceMatch" ? "price-match" : type

      await api.post(`/requests/${endpoint}/reject`, { requestId })
      console.log(`Request rejected: ${requestId}`)

      // Update local state
      setRequests((prev) => prev.map((req) => (req._id === requestId ? { ...req, status: "rejected" } : req)))
    } catch (err: any) {
      console.error(`Error rejecting request:`, err)
      alert(err.response?.data?.message || "Failed to reject request.")
    }
  }

  const handleCounterOffer = async (requestId: string, type: string) => {
    const price = counterPrice[requestId]

    if (!price || isNaN(Number.parseFloat(price))) {
      alert("Please enter a valid price for your counter offer.")
      return
    }

    try {
      await api.post(`/requests/${type}/counter`, {
        requestId,
        counterPrice: Number.parseFloat(price),
      })

      // Update local state
      setRequests((prev) => prev.map((req) => (req._id === requestId ? { ...req, status: "counter" } : req)))

      // Clear counter price input
      setCounterPrice((prev) => {
        const newState = { ...prev }
        delete newState[requestId]
        return newState
      })
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send counter offer.")
    }
  }

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "bargain":
        return "Bargain Request"
      case "bundle":
        return "Bundle Deal"
      case "priceMatch":
        return "Price Match"
      default:
        return "Request"
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs <= 0) return "Expired"

    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)

    return `${diffMins}m ${diffSecs}s`
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Farmer Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/farmer/products"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Products
          </Link>
          <Link to="/farmer/sales" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            View Sales
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-700">Welcome!</h3>
            <p className="text-gray-600">Manage your farm products and respond to customer requests.</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-700">Pending Requests</h3>
            <p className="text-gray-600">
              {requests.filter((req) => req.status === "pending").length} requests awaiting your response
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-700">Recent Activity</h3>
            <p className="text-gray-600">
              {requests.filter((req) => req.status !== "pending").length} completed requests
            </p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Products</h2>

          {products.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Start by adding products to your inventory.</p>
              <Link
                to="/farmer/products"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 3).map((product) => (
                  <div key={product._id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600">
                      ${product.price.toFixed(2)} / {product.unit}
                    </p>
                    <p className="text-gray-600">
                      Stock: {product.stock} {product.unit}
                    </p>
                    <p className="text-gray-600">Category: {product.category}</p>
                  </div>
                ))}
              </div>
              {products.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-600">Showing 3 of {products.length} products</p>
                </div>
              )}
              <div className="mt-4 text-center">
                <Link
                  to="/farmer/products"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Manage All Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Requests</h2>

          {requests.filter((req) => req.status === "pending").length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests
                .filter((req) => req.status === "pending")
                .map((request) => (
                  <div key={request._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mb-2">
                          {getRequestTypeLabel(request.type)}
                        </span>
                        <h3 className="text-lg font-semibold">{request.product.name}</h3>
                        <p className="text-gray-600">From: {request.customer.name}</p>
                        <p className="text-gray-600">
                          Current Price: ${request.product.price.toFixed(2)} / {request.product.unit}
                        </p>

                        {request.type === "bargain" && request.offeredPrice && (
                          <p className="text-blue-600 font-semibold">
                            Offered Price: ${request.offeredPrice.toFixed(2)} / {request.product.unit}
                          </p>
                        )}

                        {request.type === "bundle" && (
                          <>
                            <p className="text-purple-600 font-semibold">
                              Quantity: {request.quantity} {request.product.unit}
                            </p>
                            {request.offeredPrice && (
                              <p className="text-purple-600 font-semibold">
                                Offered Price: ${request.offeredPrice.toFixed(2)} / {request.product.unit}
                              </p>
                            )}
                          </>
                        )}

                        {request.type === "priceMatch" && request.competitorPrice && (
                          <p className="text-orange-600 font-semibold">
                            Competitor Price: ${request.competitorPrice.toFixed(2)} / {request.product.unit}
                          </p>
                        )}

                        <p className="text-gray-500 text-sm mt-2">Expires in: {getTimeRemaining(request.expiresAt)}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAccept(request._id, request.type)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request._id, request.type)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                        >
                          Reject
                        </button>

                        {/* Counter offer option for bundle deals */}
                        {request.type === "bundle" && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="Counter price"
                                value={counterPrice[request._id] || ""}
                                onChange={(e) =>
                                  setCounterPrice((prev) => ({ ...prev, [request._id]: e.target.value }))
                                }
                                className="w-24 px-2 py-1 border rounded"
                              />
                              <button
                                onClick={() => handleCounterOffer(request._id, request.type)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                              >
                                Counter
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity</h2>

          {requests.filter((req) => req.status !== "pending").length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests
                .filter((req) => req.status !== "pending")
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((request) => (
                  <div key={request._id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getRequestTypeLabel(request.type)}
                          </span>

                          {request.status === "accepted" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Accepted
                            </span>
                          )}

                          {request.status === "rejected" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Rejected
                            </span>
                          )}

                          {request.status === "expired" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Expired
                            </span>
                          )}

                          {request.status === "counter" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Counter Offered
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mt-2">{request.product.name}</h3>
                        <p className="text-gray-600">From: {request.customer.name}</p>
                        <p className="text-gray-500 text-sm">{new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FarmerDashboard
