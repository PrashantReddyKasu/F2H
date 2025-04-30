"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import ReviewForm from "../components/ReviewForm"

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    price: number
    unit: string
    farmer: {
      _id: string
      name: string
    }
  }
  quantity: number
  price: number
}

interface Order {
  _id: string
  customer: {
    _id: string
    name: string
    email: string
  }
  items: OrderItem[]
  totalAmount: number
  status: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
}

interface ReviewStatus {
  [key: string]: {
    canReview: boolean
    isReviewing: boolean
    existingReview?: any
  }
}

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>({})
  const [refreshReviews, setRefreshReviews] = useState(0)
  const isCustomer = user?.role === "customer"

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/${id}`)
        setOrder(response.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  const handleStatusUpdate = async (status: string) => {
    try {
      setStatusUpdateLoading(true)
      await api.put(`/orders/${id}/status`, { status })

      // Update local state
      setOrder((prev) => (prev ? { ...prev, status } : null))
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status")
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  const handleAssignOrder = async () => {
    try {
      setStatusUpdateLoading(true)
      await api.put(`/orders/${id}/assign`)

      // Refresh order details
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data)
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign order")
    } finally {
      setStatusUpdateLoading(false)
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

  const checkReviewStatus = async (productId: string) => {
    if (!id || !isCustomer) return

    try {
      const response = await api.get(`/reviews/can-review/${productId}/${id}`)
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: {
          canReview: response.data.canReview,
          isReviewing: false,
          existingReview: response.data.existingReview,
        },
      }))
    } catch (err) {
      console.error("Error checking review status:", err)
    }
  }

  useEffect(() => {
    if (order && isCustomer && order.status === "delivered") {
      // Check review status for each product
      order.items.forEach((item) => {
        checkReviewStatus(item.product._id)
      })
    }
  }, [order, isCustomer])

  const handleReviewSubmitted = (productId: string) => {
    setReviewStatus((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        canReview: false,
        isReviewing: false,
        existingReview: { _id: "new" }, // Placeholder to indicate a review exists
      },
    }))
    setRefreshReviews((prev) => prev + 1)
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
          ← Go Back
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Order not found
        </div>
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
          ← Go Back
        </button>
      </div>
    )
  }

  const isFarmer = user?.role === "farmer"
  const isPartner = user?.role === "partner"
  const isTrackable = ["processing", "shipped"].includes(order.status) && order.assignedTo

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Order Details</h1>
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
          ← Go Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Order #{order._id.substring(order._id.length - 6)}</h2>
            <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="mb-2">{getStatusBadge(order.status)}</div>

            {/* Track Delivery Button for Customers */}
            {isCustomer && isTrackable && (
              <Link
                to={`/track-delivery/${order._id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded"
              >
                Track Delivery
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Subtotal
                  </th>
                  {isCustomer && order.status === "delivered" && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rating
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-sm text-gray-500">
                        Farmer: {item.product.farmer ? item.product.farmer.name : "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.quantity} {item.product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                    </td>
                    {isCustomer && order.status === "delivered" && (
                      <td className="px-6 py-4">
                        {reviewStatus[item.product._id] ? (
                          reviewStatus[item.product._id].existingReview ? (
                            <div className="text-green-600 text-sm">
                              <span>✓ Reviewed</span>
                            </div>
                          ) : reviewStatus[item.product._id].isReviewing ? (
                            <button
                              onClick={() =>
                                setReviewStatus((prev) => ({
                                  ...prev,
                                  [item.product._id]: { ...prev[item.product._id], isReviewing: false },
                                }))
                              }
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Cancel
                            </button>
                          ) : reviewStatus[item.product._id].canReview ? (
                            <button
                              onClick={() =>
                                setReviewStatus((prev) => ({
                                  ...prev,
                                  [item.product._id]: { ...prev[item.product._id], isReviewing: true },
                                }))
                              }
                              className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                            >
                              Add Review
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">Cannot review</span>
                          )
                        ) : (
                          <span className="text-gray-500 text-sm">Loading...</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h3 className="font-semibold text-lg mb-2">Shipping Information</h3>
            <p className="mb-1">{order.shippingAddress.street}</p>
            <p className="mb-1">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">Payment Information</h3>
          <p>
            Method:{" "}
            {order.paymentMethod === "cash"
              ? "Cash on Delivery"
              : order.paymentMethod === "credit_card"
                ? "Credit Card"
                : "PayPal"}
          </p>
        </div>

        {/* Action buttons based on user role */}
        {(isFarmer || isPartner) && order.status !== "delivered" && order.status !== "cancelled" && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-lg mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {/* Farmer actions */}
              {isFarmer && order.status === "pending" && (
                <button
                  onClick={() => handleStatusUpdate("processing")}
                  disabled={statusUpdateLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {statusUpdateLoading ? "Processing..." : "Process Order"}
                </button>
              )}

              {/* Partner actions */}
              {isPartner && !order.assignedTo && (
                <button
                  onClick={handleAssignOrder}
                  disabled={statusUpdateLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  {statusUpdateLoading ? "Assigning..." : "Assign to Me"}
                </button>
              )}

              {isPartner && order.assignedTo === user?._id && order.status === "processing" && (
                <button
                  onClick={() => handleStatusUpdate("shipped")}
                  disabled={statusUpdateLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  {statusUpdateLoading ? "Updating..." : "Mark as Shipped"}
                </button>
              )}

              {isPartner && order.assignedTo === user?._id && order.status === "shipped" && (
                <button
                  onClick={() => handleStatusUpdate("delivered")}
                  disabled={statusUpdateLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  {statusUpdateLoading ? "Updating..." : "Mark as Delivered"}
                </button>
              )}

              {/* Cancel button for both farmer and partner */}
              {(isFarmer || (isPartner && order.assignedTo === user?._id)) && order.status !== "delivered" && (
                <button
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={statusUpdateLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  {statusUpdateLoading ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Customer cancel button */}
        {isCustomer && order.status === "pending" && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={statusUpdateLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              {statusUpdateLoading ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
      {isCustomer && order.status === "delivered" && (
        <div className="mt-6">
          {order.items.map(
            (item) =>
              reviewStatus[item.product._id]?.isReviewing && (
                <div key={`review-form-${item._id}`} className="mb-4">
                  <ReviewForm
                    productId={item.product._id}
                    orderId={order._id}
                    productName={item.product.name}
                    onReviewSubmitted={() => handleReviewSubmitted(item.product._id)}
                  />
                </div>
              ),
          )}
        </div>
      )}
    </div>
  )
}

export default OrderDetails
