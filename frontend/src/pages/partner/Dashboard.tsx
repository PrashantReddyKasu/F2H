"use client"

import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { useSocket } from "../../context/SocketContext"
import { useLocation } from "../../context/LocationContext"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"
import MapComponent from "../../components/Map"

interface Order {
  _id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  customer: {
    _id: string
    name: string
    address?: string
  }
  items: Array<{
    product: {
      _id: string
      name: string
      farmer: {
        _id: string
        name: string
      }
    }
    quantity: number
    price: number
  }>
  totalAmount: number
  createdAt: string
  assignedTo?: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

interface FarmerLocation {
  _id: string
  name: string
  location: {
    coordinates: [number, number] // [longitude, latitude]
    address?: string
  }
}

const PartnerDashboard = () => {
  const { socket } = useSocket()
  const { userLocation, isLocationEnabled, requestLocationPermission, locationError } = useLocation()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [farmerLocations, setFarmerLocations] = useState<FarmerLocation[]>([])
  const [loadingFarmers, setLoadingFarmers] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await api.get("/orders/partner/assigned")
        setOrders(response.data)

        // Filter active orders (processing or shipped)
        const active = response.data.filter((order: Order) => ["processing", "shipped"].includes(order.status))
        setActiveOrders(active)

        // Fetch farmer locations for active orders
        if (active.length > 0) {
          await fetchFarmerLocations(active)
        }
      } catch (err: any) {
        setError("Failed to load orders. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Join the partners room for socket updates
    if (socket) {
      socket.emit("join_partners")

      // Listen for order updates
      socket.on("order_update", (data) => {
        setOrders((prev) => prev.map((order) => (order._id === data._id ? { ...order, status: data.status } : order)))

        // Update active orders
        setActiveOrders((prev) => {
          const updated = prev.map((order) => (order._id === data._id ? { ...order, status: data.status } : order))
          const active = updated.filter((order) => ["processing", "shipped"].includes(order.status))

          // If active orders changed, fetch farmer locations
          if (JSON.stringify(active) !== JSON.stringify(prev)) {
            fetchFarmerLocations(active)
          }

          return active
        })
      })

      return () => {
        socket.off("order_update")
      }
    }
  }, [socket])

  // Fetch farmer locations for active orders
  const fetchFarmerLocations = async (activeOrders: Order[]) => {
    try {
      setLoadingFarmers(true)
      setDebugInfo("Fetching farmer locations...")

      // Get unique farmer IDs from all order items
      const farmerIds = new Set<string>()
      activeOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.product.farmer && item.product.farmer._id) {
            farmerIds.add(item.product.farmer._id)
          }
        })
      })

      setDebugInfo(`Found ${farmerIds.size} unique farmers`)

      if (farmerIds.size === 0) {
        setDebugInfo("No farmer IDs found in orders")
        setLoadingFarmers(false)
        return
      }

      // Fetch location for each farmer
      const farmerLocationsPromises = Array.from(farmerIds).map(async (farmerId) => {
        try {
          const response = await api.get(`/auth/users/${farmerId}`)
          console.log(`Farmer ${farmerId} data:`, response.data)
          return response.data
        } catch (error) {
          console.error(`Failed to fetch location for farmer ${farmerId}:`, error)
          return null
        }
      })

      const results = await Promise.all(farmerLocationsPromises)
      const validResults = results.filter(Boolean)

      setDebugInfo(`Received ${validResults.length} farmer locations`)
      console.log("Farmer locations:", validResults)

      // For testing: If no real locations, create some dummy ones
      if (validResults.length > 0 && userLocation && validResults.every((farmer) => !farmer.location)) {
        setDebugInfo("Creating dummy farmer locations for testing")

        const farmersWithDummyLocations = validResults.map((farmer, index) => ({
          ...farmer,
          location: {
            coordinates: [
              userLocation.coordinates[0] + (Math.random() - 0.5) * 0.05,
              userLocation.coordinates[1] + (Math.random() - 0.5) * 0.05,
            ],
            address: `Test Farm ${index + 1}, Local Area`,
          },
        }))

        setFarmerLocations(farmersWithDummyLocations)
      } else {
        setFarmerLocations(validResults)
      }
    } catch (error) {
      console.error("Failed to fetch farmer locations:", error)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoadingFarmers(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })

      // Update local state
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, status } : order)))
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
        )
      case "processing":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Processing</span>
        )
      case "shipped":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Shipped</span>
        )
      case "delivered":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>
        )
      case "cancelled":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getMapMarkers = useMemo(() => {
    const markers = []

    // Add delivery partner location
    if (userLocation) {
      markers.push({
        id: "partner-location",
        position: {
          lat: userLocation.coordinates[1],
          lng: userLocation.coordinates[0],
        },
        title: "Your Location",
        description: "Current position",
        type: "partner",
      })
    }

    // Add farmer locations
    farmerLocations.forEach((farmer) => {
      if (farmer.location && farmer.location.coordinates) {
        markers.push({
          id: `farmer-${farmer._id}`,
          position: {
            lat: farmer.location.coordinates[1],
            lng: farmer.location.coordinates[0],
          },
          title: `${farmer.name} (Farmer)`,
          description: farmer.location.address || "Pickup location",
          type: "farmer",
        })
      }
    })

    // Add active delivery destinations (customers)
    activeOrders.forEach((order) => {
      if (order.shippingAddress) {
        // In a real app, you would geocode the address to get coordinates
        // For this example, we'll use random coordinates near the partner
        const lat = userLocation ? userLocation.coordinates[1] + (Math.random() - 0.5) * 0.05 : 0
        const lng = userLocation ? userLocation.coordinates[0] + (Math.random() - 0.5) * 0.05 : 0

        markers.push({
          id: `order-${order._id}`,
          position: { lat, lng },
          title: `${order.customer.name} (Customer)`,
          description: `Order #${order._id.substring(order._id.length - 6)} - ${order.shippingAddress.street}`,
          type: "destination",
        })
      }
    })

    return markers
  }, [userLocation, activeOrders, farmerLocations])

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Delivery Partner Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/partner/deliveries"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Find Deliveries
          </Link>
          <Link
            to="/partner/revenue"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            View Revenue
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Location Tracking</h2>

        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{locationError}</div>
        )}

        {!isLocationEnabled ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="mb-2">
              Location tracking is disabled. Enable location services to start tracking deliveries.
            </p>
            <button
              onClick={requestLocationPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Enable Location Tracking
            </button>
          </div>
        ) : (
          <div>
            <p className="text-green-600 font-semibold mb-4">
              Location tracking is enabled. Your location is being shared with customers during deliveries.
            </p>

            <div className="h-64 mb-4">
              <MapComponent
                center={
                  userLocation
                    ? { lat: userLocation.coordinates[1], lng: userLocation.coordinates[0] }
                    : { lat: 40.7128, lng: -74.006 }
                }
                markers={getMapMarkers}
                height="100%"
                zoom={12}
              />
            </div>

            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Your Location</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Farmers (Pickup)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Customers (Delivery)</span>
              </div>
            </div>

            {/* Debug information */}
            {debugInfo && (
              <div className="bg-gray-100 p-2 mb-4 rounded text-xs">
                <p className="font-mono">{debugInfo}</p>
                <p className="font-mono">Farmer locations: {farmerLocations.length}</p>
                <p className="font-mono">Map markers: {getMapMarkers.length}</p>
                <button
                  onClick={() => fetchFarmerLocations(activeOrders)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1 px-2 rounded mt-1"
                >
                  Refresh Farmer Locations
                </button>
              </div>
            )}

            <Link to="/location-settings" className="text-blue-600 hover:underline">
              Manage location settings
            </Link>
          </div>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Deliveries</h2>

          {activeOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active deliveries at the moment.</p>
              <Link
                to="/partner/deliveries"
                className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Find Deliveries to Accept
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order._id.substring(order._id.length - 6)}</h3>
                      <p className="text-gray-600">Customer: {order.customer.name}</p>
                      {order.shippingAddress && (
                        <p className="text-gray-600">
                          Delivery Address: {order.shippingAddress.street}, {order.shippingAddress.city}
                        </p>
                      )}
                      <p className="text-gray-600">Amount: ${order.totalAmount.toFixed(2)}</p>

                      {/* Display farmer pickup information */}
                      <div className="mt-2 mb-2">
                        <p className="font-medium">Pickup from:</p>
                        <ul className="list-disc pl-5">
                          {Array.from(new Set(order.items.map((item) => item.product.farmer._id))).map((farmerId) => {
                            const farmer = order.items.find((item) => item.product.farmer._id === farmerId)?.product
                              .farmer
                            const farmerWithLocation = farmerLocations.find((f) => f._id === farmerId)

                            return (
                              <li key={farmerId} className="text-gray-600">
                                {farmer?.name}
                                {farmerWithLocation?.location?.address && (
                                  <span className="text-gray-500"> ({farmerWithLocation.location.address})</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div className="mt-2">{getStatusBadge(order.status)}</div>
                    </div>
                    <div>
                      <Link
                        to={`/order/${order._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Deliveries</h2>

          {orders.filter((order) => ["delivered", "cancelled"].includes(order.status)).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No completed deliveries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders
                    .filter((order) => ["delivered", "cancelled"].includes(order.status))
                    .slice(0, 5)
                    .map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">#{order._id.substring(order._id.length - 6)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${order.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/order/${order._id}`} className="text-blue-600 hover:text-blue-900">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PartnerDashboard
