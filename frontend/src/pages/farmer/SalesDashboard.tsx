"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"
import { useAuth } from "../../context/AuthContext"

interface OrderItem {
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
  createdAt: string
  updatedAt: string
}

interface SalesStats {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
  averageOrderValue: number
  revenueByStatus: {
    [key: string]: number
  }
  revenueByProduct: {
    [key: string]: {
      name: string
      revenue: number
      quantity: number
    }
  }
  monthlySales: {
    [key: string]: number
  }
}

const SalesDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    averageOrderValue: 0,
    revenueByStatus: {},
    revenueByProduct: {},
    monthlySales: {},
  })
  const [timeFilter, setTimeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { user } = useAuth()

  // Get farmer ID from multiple sources to ensure we have it
  const farmerId = user?._id || localStorage.getItem("userId")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        console.log("Fetching orders for farmer ID:", farmerId)

        // Make sure we have a token set
        const token = localStorage.getItem("token")
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        }

        const response = await api.get("/orders/farmer")
        console.log("Orders API response:", response.data)

        // Check if response data exists and is an array
        if (response.data && Array.isArray(response.data)) {
          setOrders(response.data)

          calculateStats(response.data)
        } else {
          console.error("Invalid response format:", response.data)
          setError("Received invalid data format from server")
        }
      } catch (err) {
        console.error("Error fetching farmer orders:", err)
        setError("Failed to load sales data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (farmerId) {
      fetchOrders()
    } else {
      setError("Could not identify farmer. Please log in again.")
      setLoading(false)
    }
  }, [farmerId])

  useEffect(() => {
    // Apply filters and recalculate stats when filters change
    const filteredOrders = filterOrders(orders)
    calculateStats(filteredOrders)
  }, [timeFilter, statusFilter, orders])

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }

      // Time filter
      if (timeFilter !== "all") {
        const orderDate = new Date(order.createdAt)
        const now = new Date()

        switch (timeFilter) {
          case "today":
            return orderDate.toDateString() === now.toDateString()
          case "week":
            const weekAgo = new Date()
            weekAgo.setDate(now.getDate() - 7)
            return orderDate >= weekAgo
          case "month":
            const monthAgo = new Date()
            monthAgo.setMonth(now.getMonth() - 1)
            return orderDate >= monthAgo
          case "year":
            const yearAgo = new Date()
            yearAgo.setFullYear(now.getFullYear() - 1)
            return orderDate >= yearAgo
          default:
            return true
        }
      }

      return true
    })
  }

  const calculateStats = (orderList: Order[]) => {
    if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        totalProductsSold: 0,
        averageOrderValue: 0,
        revenueByStatus: {},
        revenueByProduct: {},
        monthlySales: {},
      })
      return
    }

    console.log("Calculating stats for", orderList.length, "orders with farmer ID:", farmerId)

    let totalRevenue = 0
    let totalProductsSold = 0
    const revenueByStatus: { [key: string]: number } = {}
    const revenueByProduct: {
      [key: string]: { name: string; revenue: number; quantity: number }
    } = {}
    const monthlySales: { [key: string]: number } = {}

    // Count orders that contain products from this farmer
    let farmerOrderCount = 0

    // Calculate farmer's revenue from each order
    orderList.forEach((order) => {
      let orderRevenue = 0
      let farmerItemsInOrder = 0

      // Only count items from this farmer
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          // Check if this item belongs to the current farmer
          const itemFarmerId = item.product?.farmer?._id?.toString()

          if (itemFarmerId === farmerId) {
            farmerItemsInOrder++
            const itemRevenue = item.price * item.quantity
            orderRevenue += itemRevenue
            totalProductsSold += item.quantity

            // Track revenue by product
            if (!revenueByProduct[item.product._id]) {
              revenueByProduct[item.product._id] = {
                name: item.product.name,
                revenue: 0,
                quantity: 0,
              }
            }
            revenueByProduct[item.product._id].revenue += itemRevenue
            revenueByProduct[item.product._id].quantity += item.quantity
          }
        })
      }

      if (farmerItemsInOrder > 0) {
        farmerOrderCount++
        totalRevenue += orderRevenue

        // Track revenue by status
        if (!revenueByStatus[order.status]) {
          revenueByStatus[order.status] = 0
        }
        revenueByStatus[order.status] += orderRevenue

        // Track monthly sales
        const date = new Date(order.createdAt)
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
        if (!monthlySales[monthYear]) {
          monthlySales[monthYear] = 0
        }
        monthlySales[monthYear] += orderRevenue
      }
    })

    console.log("Stats calculation results:", {
      totalRevenue,
      farmerOrderCount,
      totalProductsSold,
      revenueByStatus,
      productCount: Object.keys(revenueByProduct).length,
    })

    // Calculate average order value
    const averageOrderValue = farmerOrderCount > 0 ? totalRevenue / farmerOrderCount : 0

    setStats({
      totalRevenue,
      totalOrders: farmerOrderCount,
      totalProductsSold,
      averageOrderValue,
      revenueByStatus,
      revenueByProduct,
      monthlySales,
    })
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get top selling products
  const getTopProducts = () => {
    return Object.values(stats.revenueByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  // Add this function inside the component
  const handleRetry = () => {
    setError("")
    setLoading(true)

    // Fetch orders again
    api
      .get("/orders/farmer")
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setOrders(response.data)
          calculateStats(response.data)
        } else {
          console.error("Invalid response format:", response.data)
          setError("Received invalid data format from server")
        }
      })
      .catch((err) => {
        console.error("Error fetching farmer orders:", err)
        setError("Failed to load sales data. Please try again later.")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Handle logout and redirect
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("userId")

    // Redirect to login page
    window.location.href = "/login"
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Sales Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/farmer/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Dashboard
          </Link>
          <Link
            to="/farmer/products"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Products
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <div>
            {error === "Could not identify farmer. Please log in again." ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Log In Again
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Products Sold</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalProductsSold}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Order Value</h3>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.averageOrderValue)}</p>
        </div>
      </div>

      {/* Revenue by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue by Status</h3>
          {Object.keys(stats.revenueByStatus).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.revenueByStatus).map(([status, revenue]) => (
                <div key={status} className="flex items-center">
                  <div className="w-32">{getStatusBadge(status)}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          status === "delivered"
                            ? "bg-green-500"
                            : status === "shipped"
                              ? "bg-purple-500"
                              : status === "processing"
                                ? "bg-blue-500"
                                : status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                        }`}
                        style={{ width: `${(revenue / stats.totalRevenue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right font-medium">{formatCurrency(revenue)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No revenue data available</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          {getTopProducts().length > 0 ? (
            <div className="space-y-4">
              {getTopProducts().map((product) => (
                <div key={product.name} className="flex items-center">
                  <div className="w-40 truncate">{product.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(product.revenue / getTopProducts()[0].revenue) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <div className="font-medium">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-gray-500">{product.quantity} units</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No product data available</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          {orders.length > 0 ? (
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
                    Date
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
                    Items
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Revenue
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
                {filterOrders(orders)
                  .filter((order) => {
                    // Only show orders that have items from this farmer
                    return order.items.some((item) => item.product?.farmer?._id?.toString() === farmerId)
                  })
                  .slice(0, 10)
                  .map((order) => {
                    // Calculate revenue from this order for the current farmer
                    const farmerItems = order.items.filter((item) => item.product?.farmer?._id?.toString() === farmerId)
                    const orderRevenue = farmerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

                    if (farmerItems.length === 0) return null

                    return (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">#{order._id.substring(order._id.length - 6)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{farmerItems.length} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(orderRevenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/order/${order._id}`} className="text-blue-600 hover:text-blue-900">
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found with the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesDashboard
