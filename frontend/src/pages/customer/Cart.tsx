"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import LoadingSpinner from "../../components/LoadingSpinner"

const Cart = () => {
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart, getCartTotal } = useCart()
  const navigate = useNavigate()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateCartItem(itemId, quantity)
    } catch (err) {
      console.error("Error updating quantity:", err)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId)
    } catch (err) {
      console.error("Error removing item:", err)
    }
  }

  const handleCheckout = () => {
    navigate("/checkout")
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link
            to="/customer/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Your Cart</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                Price
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
                Subtotal
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
            {cart.items.map((item) => {
              const price = item.specialPrice !== undefined ? item.specialPrice : item.product.price
              const subtotal = price * item.quantity

              return (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">
                          Sold by: {item.product.farmer ? item.product.farmer.name : "Unknown Farmer"}
                        </div>
                        {item.requestType && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.requestType === "bargain" && "Bargain Request"}
                              {item.requestType === "bundle" && "Bundle Deal"}
                              {item.requestType === "priceMatch" && "Price Match"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${price.toFixed(2)} / {item.product.unit}
                      {item.specialPrice !== undefined && (
                        <div className="text-xs text-green-600 font-semibold">
                          Special price! (Original: ${item.product.price.toFixed(2)})
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-l"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item._id,
                            Math.min(item.product.stock, Math.max(1, Number.parseInt(e.target.value) || 1)),
                          )
                        }
                        className="w-12 text-center py-1 border-t border-b border-gray-300"
                      />
                      <button
                        onClick={() => handleQuantityChange(item._id, Math.min(item.product.stock, item.quantity + 1))}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-r"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${subtotal.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleRemoveItem(item._id)} className="text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-semibold">
                Total:
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-lg font-bold text-green-600">${getCartTotal().toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 flex justify-between">
        <Link to="/customer/dashboard" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Continue Shopping
        </Link>
        <div className="space-x-4">
          <button
            onClick={() => clearCart()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear Cart
          </button>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
