"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { useLocation } from "../../context/LocationContext"
import api from "../../services/api"
import MapComponent from "../../components/Map"
import LoadingSpinner from "../../components/LoadingSpinner"

interface Order {
  _id: string
  status: string
  assignedTo: string | null
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: any[]
  totalAmount: number
  createdAt: string
}

interface DeliveryPartner {
  _id: string
  name: string
  phoneNumber?: string
}

const TrackDelivery = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const {
    userLocation,
    deliveryPartnerLocations,
    getDeliveryPartnerLocation,
    isLocationEnabled,
    requestLocationPermission,
  } = useLocation()

  const [order, setOrder] = useState<Order | null>(null)
  const [partner, setPartner] = useState<DeliveryPartner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  // Fetch order details - using useCallback to prevent recreation on every render
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || hasAttemptedFetch) return

    try {
      setLoading(true)
      setError(null)
      setHasAttemptedFetch(true)

      // Fetch order details
      console.log("Fetching order details for:", orderId)
      const response = await api.get(`/orders/${orderId}`)
      setOrder(response.data)

      // If order has an assigned delivery partner
      if (response.data.assignedTo) {
        try {
          // Fetch partner details
          console.log("Fetching partner details for:", response.data.assignedTo)
          const partnerResponse = await api.get(`/auth/users/${response.data.assignedTo}`)
          setPartner(partnerResponse.data)
        } catch (partnerErr) {
          console.error("Error fetching partner details:", partnerErr)
          // Don't fail the whole page if just partner details fail
        }

        try {
          // Get partner's location
          console.log("Fetching partner location for order:", orderId)
          await getDeliveryPartnerLocation(orderId)
        } catch (locationErr) {
          console.error("Error fetching partner location:", locationErr)
          // Don't fail the whole page if just location fails
        }
      }
    } catch (err: any) {
      console.error("Error in fetchOrderDetails:", err)
      setError(err.response?.data?.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }, [orderId, getDeliveryPartnerLocation, hasAttemptedFetch])

  // Use a separate useEffect for the initial fetch
  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  // Calculate estimated delivery time
  useEffect(() => {
    if (!order || !partner || !deliveryPartnerLocations[orderId as string] || !userLocation) {
      return
    }

    // Simple estimation based on distance
    // In a real app, you would use a routing service to get accurate estimates
    const partnerLocation = deliveryPartnerLocations[orderId as string].location

    // Calculate distance (very rough approximation)
    const lat1 = partnerLocation.coordinates[1]
    const lon1 = partnerLocation.coordinates[0]
    const lat2 = userLocation.coordinates[1]
    const lon2 = userLocation.coordinates[0]

    // Haversine formula for distance
    const R = 6371 // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in km

    // Assume average speed of 30 km/h
    const timeInMinutes = Math.round(distance * 2) // Multiply by 2 for a rough estimate

    if (timeInMinutes < 1) {
      setEstimatedTime("Less than a minute")
    } else if (timeInMinutes < 60) {
      setEstimatedTime(`About ${timeInMinutes} minutes`)
    } else {
      const hours = Math.floor(timeInMinutes / 60)
      const minutes = timeInMinutes % 60
      setEstimatedTime(`About ${hours} hour${hours > 1 ? "s" : ""} ${minutes > 0 ? `and ${minutes} minutes` : ""}`)
    }
  }, [order, partner, deliveryPartnerLocations, orderId, userLocation])

  // Memoize map markers to prevent recalculation on every render
  const getMapMarkers = useCallback(() => {
    const markers = []

    // Add user location marker
    if (userLocation) {
      markers.push({
        id: "user-location",
        position: {
          lat: userLocation.coordinates[1],
          lng: userLocation.coordinates[0],
        },
        title: "Your Location",
        description: "Delivery destination",
        type: "destination",
      })
    }

    // Add delivery partner marker
    if (orderId && deliveryPartnerLocations[orderId]) {
      const partnerLocation = deliveryPartnerLocations[orderId].location
      markers.push({
        id: "partner-location",
        position: {
          lat: partnerLocation.coordinates[1],
          lng: partnerLocation.coordinates[0],
        },
        title: `${partner?.name || "Delivery Partner"}`,
        description: "Currently delivering your order",
        type: "partner",
      })
    }

    return markers
  }, [userLocation, deliveryPartnerLocations, orderId, partner])

  // Memoize map center to prevent recalculation on every render
  const getMapCenter = useCallback(() => {
    // If we have partner location, center on that
    if (orderId && deliveryPartnerLocations[orderId]) {
      const partnerLocation = deliveryPartnerLocations[orderId].location
      return {
        lat: partnerLocation.coordinates[1],
        lng: partnerLocation.coordinates[0],
      }
    }

    // Otherwise center on user location
    if (userLocation) {
      return {
        lat: userLocation.coordinates[1],
        lng: userLocation.coordinates[0],
      }
    }

    // Default fallback
    return { lat: 40.7128, lng: -74.006 }
  }, [deliveryPartnerLocations, orderId, userLocation])

  // Handle manual refresh
  const handleRefresh = () => {
    setHasAttemptedFetch(false)
    fetchOrderDetails()
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <p className="mt-2 text-sm">Please try again or contact support if the issue persists.</p>
        </div>
        <div className="flex space-x-4">
          <Link to="/customer/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
          <button onClick={handleRefresh} className="text-green-600 hover:underline">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Order not found
        </div>
        <Link to="/customer/orders" className="text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  // Check if order is in a trackable state
  const isTrackable = ["processing", "shipped"].includes(order.status) && order.assignedTo

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Track Delivery</h1>
        <div className="flex space-x-4">
          <button onClick={handleRefresh} className="text-green-600 hover:underline">
            Refresh
          </button>
          <Link to="/customer/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order #{order._id.substring(order._id.length - 6)}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Order Status</h3>
            <div className="flex items-center mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            {isTrackable && partner ? (
              <>
                <h3 className="font-semibold text-lg mb-2">Delivery Partner</h3>
                <p className="mb-1">{partner.name}</p>
                {partner.phoneNumber && (
                  <p className="mb-4">
                    <a href={`tel:${partner.phoneNumber}`} className="text-blue-600 hover:underline">
                      {partner.phoneNumber}
                    </a>
                  </p>
                )}

                {estimatedTime && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-2">Estimated Delivery Time</h3>
                    <p className="text-green-600 font-semibold">{estimatedTime}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mb-4">
                <p className="text-gray-600">
                  {order.status === "pending"
                    ? "Your order is pending. No delivery partner has been assigned yet."
                    : order.status === "delivered"
                      ? "Your order has been delivered."
                      : order.status === "cancelled"
                        ? "This order has been cancelled."
                        : "Tracking information is not available for this order."}
                </p>
              </div>
            )}

            <h3 className="font-semibold text-lg mb-2">Shipping Address</h3>
            <p className="mb-1">{order.shippingAddress.street}</p>
            <p className="mb-1">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p className="mb-4">{order.shippingAddress.country}</p>

            <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
            <p className="mb-1">{order.items.length} item(s)</p>
            <p className="mb-1">Total: ${order.totalAmount.toFixed(2)}</p>
            <p className="mb-4">Ordered on: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            {isTrackable ? (
              isLocationEnabled ? (
                <MapComponent center={getMapCenter()} markers={getMapMarkers()} height="400px" zoom={12} />
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  <p className="mb-2">Location services are disabled. Enable location to track your delivery.</p>
                  <button
                    onClick={requestLocationPermission}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Enable Location Services
                  </button>
                </div>
              )
            ) : (
              <div className="bg-gray-100 p-6 rounded text-center h-full flex items-center justify-center">
                <p className="text-gray-600">
                  {order.status === "delivered"
                    ? "This order has been delivered."
                    : order.status === "cancelled"
                      ? "This order has been cancelled."
                      : "Tracking will be available once a delivery partner is assigned to your order."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackDelivery
