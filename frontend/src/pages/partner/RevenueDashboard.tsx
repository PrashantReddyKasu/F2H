"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"

interface Order {
  _id: string
  customer: {
    _id: string
    name: string
  }
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: any[]
}

interface RevenueStats {
  totalRevenue: number
  totalDeliveries: number
  pendingDeliveries: number
  completedDeliveries: number
  monthlyRevenue: {
    [key: string]: number
  }
}

// Delivery fee per order
const DELIVERY_FEE = 10

const RevenueDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    monthlyRevenue: {},
  })
  const [timeFilter, setTimeFilter] = useState("all")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await api.get("/orders/partner/assigned")
        setOrders(response.data)
        calculateStats(response.data)
      } catch (err: any) {
        setError("Failed to load revenue data. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    // Apply filters and recalculate stats when filters change
    const filteredOrders = filterOrders(orders)
    calculateStats(filteredOrders)
  }, [timeFilter, orders])

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((order) => {
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
    if (!orderList.length) {
      setStats({
        totalRevenue: 0,
        totalDeliveries: 0,
        pendingDeliveries: 0,
        completedDeliveries: 0,
        monthlyRevenue: {},
      })
      return
    }

    let totalRevenue = 0
    let pendingDeliveries = 0
    let completedDeliveries = 0
    const monthlyRevenue: { [key: string]: number } = {}

    orderList.forEach((order) => {
      // Count pending deliveries (processing or shipped)
      if (["processing", "shipped"].includes(order.status)) {
        pendingDeliveries++
      }

      // Count completed deliveries and calculate revenue
      if (order.status === "delivered") {
        completedDeliveries++
        totalRevenue += DELIVERY_FEE

        // Track monthly revenue
        const date = new Date(order.updatedAt)
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
        if (!monthlyRevenue[monthYear]) {
          monthlyRevenue[monthYear] = 0
        }
        monthlyRevenue[monthYear] += DELIVERY_FEE
      }
    })

    setStats({
      totalRevenue,
      totalDeliveries: orderList.length,
      pendingDeliveries,
      completedDeliveries,
      monthlyRevenue,
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

  // Get monthly revenue data sorted by date
  const getMonthlyRevenueData = () => {
    return Object.entries(stats.monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => {
        const [year, monthNum] = month.split("-")
        return {
          month: `${new Date(0, Number.parseInt(monthNum) - 1).toLocaleString("default", { month: "short" })} ${year}`,
          revenue,
        }
      })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Revenue Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/partner/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Dashboard
          </Link>
          <Link
            to="/partner/deliveries"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Find Deliveries
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">@ {formatCurrency(DELIVERY_FEE)} per delivery</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Deliveries</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalDeliveries}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed Deliveries</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedDeliveries}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Deliveries</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingDeliveries}</p>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
        {getMonthlyRevenueData().length > 0 ? (
          <div className="space-y-4">
            {getMonthlyRevenueData().map((item) => (
              <div key={item.month} className="flex items-center">
                <div className="w-32">{item.month}</div>
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(item.revenue / Math.max(...getMonthlyRevenueData().map((i) => i.revenue))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-24 text-right font-medium">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No revenue data available for this period</p>
        )}
      </div>

      {/* Delivery History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Delivery History</h3>
        </div>
        <div className="overflow-x-auto">
          {filterOrders(orders).length > 0 ? (
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
                    Earnings
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
                {filterOrders(orders).map((order) => (
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
                      <div className="text-sm text-gray-900">{order.items.length} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.status === "delivered" ? formatCurrency(DELIVERY_FEE) : "Pending"}
                      </div>
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No deliveries found with the selected filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Potential Earnings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Potential Earnings</h3>
        <div className="flex items-center">
          <div className="w-40">Pending Deliveries</div>
          <div className="flex-1 mx-4">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{
                  width: `${(stats.pendingDeliveries * 100) / (stats.pendingDeliveries + stats.completedDeliveries || 1)}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="w-32 text-right font-medium">{formatCurrency(stats.pendingDeliveries * DELIVERY_FEE)}</div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Complete your pending deliveries to earn an additional{" "}
          {formatCurrency(stats.pendingDeliveries * DELIVERY_FEE)}.
        </p>
      </div>
    </div>
  )
}

export default RevenueDashboard
