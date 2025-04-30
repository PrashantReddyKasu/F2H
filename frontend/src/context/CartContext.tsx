"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import api from "../services/api"

interface CartProduct {
  _id: string
  name: string
  price: number
  unit: string
  stock: number
  farmer: {
    _id: string
    name: string
  } | null
  image?: string
}

interface CartItem {
  _id: string
  product: CartProduct
  quantity: number
  specialPrice?: number
  requestId?: string
  requestType?: "bargain" | "bundle" | "priceMatch"
}

interface Cart {
  _id: string
  customer: string
  items: CartItem[]
  updatedAt: string
}

interface CartContextType {
  cart: Cart | null
  loading: boolean
  error: string | null
  addToCart: (
    productId: string,
    quantity?: number,
    specialPrice?: number,
    requestId?: string,
    requestType?: string,
  ) => Promise<void>
  updateCartItem: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  updateCartItemByRequest: (requestId: string, specialPrice: number, requestType: string) => Promise<void>
  getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()

  // Fetch cart when user is authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (isAuthenticated && user && user.role === "customer") {
        try {
          setLoading(true)
          const response = await api.get("/cart")
          setCart(response.data)
          setError(null)
        } catch (err: any) {
          console.error("Error fetching cart:", err)
          setError(err.response?.data?.message || "Failed to load cart")
        } finally {
          setLoading(false)
        }
      } else {
        setCart(null)
        setLoading(false)
      }
    }

    fetchCart()
  }, [isAuthenticated, user])

  // Add item to cart
  const addToCart = async (
    productId: string,
    quantity = 1,
    specialPrice?: number,
    requestId?: string,
    requestType?: string,
  ) => {
    try {
      console.log("Adding to cart:", { productId, quantity, specialPrice, requestId, requestType })
      setLoading(true)
      // Fix: Use the correct endpoint /cart/items
      const response = await api.post("/cart/items", {
        productId,
        quantity,
        specialPrice,
        requestId,
        requestType,
      })
      console.log("Cart response:", response.data)
      setCart(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Error adding to cart:", err)
      setError(err.response?.data?.message || "Failed to add item to cart")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update cart item
  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      const response = await api.put("/cart/items", {
        itemId,
        quantity,
      })
      setCart(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Error updating cart item:", err)
      setError(err.response?.data?.message || "Failed to update cart item")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true)
      const response = await api.delete(`/cart/items/${itemId}`)
      setCart(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Error removing from cart:", err)
      setError(err.response?.data?.message || "Failed to remove item from cart")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true)
      const response = await api.delete("/cart")
      setCart(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Error clearing cart:", err)
      setError(err.response?.data?.message || "Failed to clear cart")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update cart item by request ID
  const updateCartItemByRequest = async (requestId: string, specialPrice: number, requestType: string) => {
    try {
      setLoading(true)
      const response = await api.put("/cart/items/request", {
        requestId,
        specialPrice,
        requestType,
      })
      setCart(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Error updating cart item by request:", err)
      setError(err.response?.data?.message || "Failed to update cart item")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Calculate cart total
  const getCartTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return 0
    }

    return cart.items.reduce((total, item) => {
      const price = item.specialPrice !== undefined ? item.specialPrice : item.product.price
      return total + price * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        updateCartItemByRequest,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
