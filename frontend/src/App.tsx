"use client"

// Make sure the App.tsx file is correctly importing BrowserRouter
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import { CartProvider } from "./context/CartContext"
import { LocationProvider } from "./context/LocationContext"
import Navbar from "./components/Navbar"
import LoadingSpinner from "./components/LoadingSpinner"
import PrivateRoute from "./components/PrivateRoute"

// Lazy load pages for better performance
const HomePage = lazy(() => import("./pages/HomePage"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"))
const FarmerDashboard = lazy(() => import("./pages/farmer/Dashboard"))
const PartnerDashboard = lazy(() => import("./pages/partner/Dashboard"))
const ProductDetails = lazy(() => import("./pages/customer/ProductDetails"))
const ManageProducts = lazy(() => import("./pages/farmer/ManageProducts"))
const OrderDetails = lazy(() => import("./pages/OrderDetails"))
const DeliveryManagement = lazy(() => import("./pages/partner/DeliveryManagement"))
const Cart = lazy(() => import("./pages/customer/Cart"))
const Checkout = lazy(() => import("./pages/customer/Checkout"))
const OrderConfirmation = lazy(() => import("./pages/customer/OrderConfirmation"))
const CustomerOrders = lazy(() => import("./pages/customer/Orders"))
const Profile = lazy(() => import("./pages/Profile"))
const TrackDelivery = lazy(() => import("./pages/customer/TrackDelivery"))
const LocationSettings = lazy(() => import("./pages/LocationSettings"))
const NearbyFarmers = lazy(() => import("./pages/customer/NearbyFarmers"))
const FarmerProducts = lazy(() => import("./pages/customer/FarmerProducts"))
const SalesDashboard = lazy(() => import("./pages/farmer/SalesDashboard"))
const RevenueDashboard = lazy(() => import("./pages/partner/RevenueDashboard"))

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <LocationProvider>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Customer routes */}
                    <Route
                      path="/customer/dashboard"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <CustomerDashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/product/:id"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <ProductDetails />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <Cart />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <Checkout />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/order-confirmation/:id"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <OrderConfirmation />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/customer/orders"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <CustomerOrders />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/track-delivery/:orderId"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <TrackDelivery />
                        </PrivateRoute>
                      }
                    />
                    {/* New routes for nearby farmers */}
                    <Route
                      path="/nearby-farmers"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <NearbyFarmers />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/farmer/:farmerId/products"
                      element={
                        <PrivateRoute allowedRoles={["customer"]}>
                          <FarmerProducts />
                        </PrivateRoute>
                      }
                    />
                    {/* Farmer routes */}
                    <Route
                      path="/farmer/dashboard"
                      element={
                        <PrivateRoute allowedRoles={["farmer"]}>
                          <FarmerDashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/farmer/products"
                      element={
                        <PrivateRoute allowedRoles={["farmer"]}>
                          <ManageProducts />
                        </PrivateRoute>
                      }
                    />
                    {/* Delivery partner routes */}
                    <Route
                      path="/partner/dashboard"
                      element={
                        <PrivateRoute allowedRoles={["partner"]}>
                          <PartnerDashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/partner/deliveries"
                      element={
                        <PrivateRoute allowedRoles={["partner"]}>
                          <DeliveryManagement />
                        </PrivateRoute>
                      }
                    />
                    {/* Farmer sales route */}
                    <Route
                      path="/farmer/sales"
                      element={
                        <PrivateRoute allowedRoles={["farmer"]}>
                          <SalesDashboard />
                        </PrivateRoute>
                      }
                    />

                    {/* Partner revenue route */}
                    <Route
                      path="/partner/revenue"
                      element={
                        <PrivateRoute allowedRoles={["partner"]}>
                          <RevenueDashboard />
                        </PrivateRoute>
                      }
                    />
                    {/* Shared routes */}
                    <Route
                      path="/order/:id"
                      element={
                        <PrivateRoute allowedRoles={["customer", "farmer", "partner"]}>
                          <OrderDetails />
                        </PrivateRoute>
                      }
                    />
                    {/* Profile route for all users */}
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute allowedRoles={["customer", "farmer", "partner"]}>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                    {/* Location settings for all users */}
                    <Route
                      path="/location-settings"
                      element={
                        <PrivateRoute allowedRoles={["customer", "farmer", "partner"]}>
                          <LocationSettings />
                        </PrivateRoute>
                      }
                    />
                    {/* Fallback for unknown routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </LocationProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
