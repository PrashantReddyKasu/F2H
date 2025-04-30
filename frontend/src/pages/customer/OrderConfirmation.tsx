"use client"

import { useEffect, useState } from "react"
import { useParams, useLocation, Link, useNavigate } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"

interface OrderDetails {
  _id: string
  status: string
  totalAmount: number
  createdAt: string
  items: Array<{
    product: {
      name: string
      price: number
      unit: string
    }
    quantity: number
    price: number
  }>
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: string
}

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const isNewOrder = location.state?.isNewOrder || false

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!id) {
          setError("Order ID is missing")
          setLoading(false)
          return
        }

        const response = await api.get(`/orders/${id}`)
        setOrder(response.data)
      } catch (err: any) {
        console.error("Error fetching order:", err)
        setError(err.response?.data?.message || "Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id])

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Order not found.</p>
        </div>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        {isNewOrder && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-center mb-2">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <p className="text-center text-lg font-bold">Order Placed Successfully!</p>
            <p className="text-center">Thank you for your order.</p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Order Confirmation</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-2">Order Details</h2>
          <p>
            <span className="font-medium">Order ID:</span> #{order._id.substring(order._id.length - 6)}
          </p>
          <p>
            <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Status:</span> {order.status}
          </p>
        </div>

        {order.shippingAddress && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b pb-2 mb-2">Shipping Address</h2>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-2">Payment Method</h2>
          <p>
            {order.paymentMethod === "cash" && "Cash on Delivery"}
            {order.paymentMethod === "credit_card" && "Credit Card"}
            {order.paymentMethod === "paypal" && "PayPal"}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-2">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">
                    ${item.price.toFixed(2)} x {item.quantity} {item.product.unit}
                  </p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-bold text-lg">
              <p>Total:</p>
              <p>${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Link
            to="/customer/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
