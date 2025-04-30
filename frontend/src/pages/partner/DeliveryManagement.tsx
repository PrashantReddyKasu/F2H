"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"

interface Order {
  _id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  customer: {
    _id: string
    name: string
    address?: string
  }
  totalAmount: number
  createdAt: string
  assignedTo?: string
}

const DeliveryManagement = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders/partner/unassigned")
        setOrders(response.data)
      } catch (err: any) {
        setError("Failed to load orders. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

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

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true
    return order.status === filter
  })

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/assign`)

      // Remove the order from the list
      setOrders((prev) => prev.filter((order) => order._id !== orderId))

      alert("Order accepted successfully! You can find it in your dashboard.")
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to accept order.")
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Delivery Management</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("processing")}
            className={`px-4 py-2 rounded-lg ${filter === "processing" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Processing
          </button>
          <button
            onClick={() => setFilter("shipped")}
            className={`px-4 py-2 rounded-lg ${filter === "shipped" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Shipped
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-4 py-2 rounded-lg ${filter === "delivered" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Delivered
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg ${filter === "cancelled" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found with the selected filter.</p>
          </div>
        ) : (
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
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">#{order._id.substring(order._id.length - 6)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-sm text-gray-500">{order.customer.address || "No address"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${order.totalAmount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/order/${order._id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>

                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Accept
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default DeliveryManagement
