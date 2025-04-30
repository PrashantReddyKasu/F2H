"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useSocket } from "../../context/SocketContext"
import { useCart } from "../../context/CartContext"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"
// Add these imports at the top
import StarRating from "../../components/StarRating"
import ProductReviews from "../../components/ProductReviews"

// Update the Product interface to include rating fields
interface Product {
  _id: string
  name: string
  description: string
  price: number
  unit: string
  stock: number
  category: string
  averageRating: number
  reviewCount: number
  farmer: {
    _id: string
    name: string
  } | null
  image?: string
}

// Update the SimilarProduct interface to include category
interface SimilarProduct {
  _id: string
  name: string
  price: number
  unit: string
  category: string
  farmer: {
    _id: string
    name: string
  } | null
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { addToCart } = useCart() // Use the cart context instead of local function

  const [product, setProduct] = useState<Product | null>(null)
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // Add this state variable inside the component
  const [refreshReviews, setRefreshReviews] = useState(0)

  // Bargain state
  const [showBargainForm, setShowBargainForm] = useState(false)
  const [bargainPrice, setBargainPrice] = useState("")
  const [bargainLoading, setBargainLoading] = useState(false)
  const [bargainStatus, setBargainStatus] = useState<string | null>(null)

  // Bundle deal state
  const [showBundleForm, setShowBundleForm] = useState(false)
  const [bundleQuantity, setBundleQuantity] = useState(10)
  const [bundlePrice, setBundlePrice] = useState("")
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleStatus, setBundleStatus] = useState<string | null>(null)

  // Price match state
  const [showPriceMatchForm, setShowPriceMatchForm] = useState(false)
  const [selectedCompetitor, setSelectedCompetitor] = useState("")
  const [priceMatchLoading, setPriceMatchLoading] = useState(false)
  const [priceMatchStatus, setPriceMatchStatus] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        console.log("Fetching product details for ID:", id)
        const response = await api.get(`/products/${id}`)
        console.log("Product details response:", response.data)
        setProduct(response.data)

        // Fetch similar products (same product from different farmers)
        const similarResponse = await api.get(`/products/similar/${id}`)
        console.log("Similar products response:", similarResponse.data)
        setSimilarProducts(similarResponse.data)
      } catch (err: any) {
        console.error("Error fetching product details:", err)
        setError("Failed to load product details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetails()
  }, [id])

  useEffect(() => {
    if (socket) {
      // Listen for bargain updates
      socket.on("bargain_update", (data) => {
        if (data.productId === id) {
          setBargainStatus(data.status)
          setBargainLoading(false)

          if (data.status === "accepted") {
            alert(`Your bargain request has been accepted! New price: $${data.price}`)
            // No need to update product price here anymore
          } else if (data.status === "rejected") {
            alert("Your bargain request has been rejected by the farmer.")
          } else if (data.status === "expired") {
            alert("Your bargain request has expired without a response.")
          }
        }
      })

      // Listen for bundle deal updates
      socket.on("bundle_update", (data) => {
        if (data.productId === id) {
          setBundleStatus(data.status)
          setBundleLoading(false)

          if (data.status === "accepted") {
            alert(`Your bundle deal request has been accepted! New price: $${data.price} for ${data.quantity} units`)
            // No need to update product price here anymore
          } else if (data.status === "rejected") {
            alert("Your bundle deal request has been rejected by the farmer.")
          } else if (data.status === "expired") {
            alert("Your bundle deal request has expired without a response.")
          } else if (data.status === "counter") {
            alert(`The farmer has made a counter offer: $${data.price} for ${data.quantity} units`)
          }
        }
      })

      // Listen for price match updates
      socket.on("price_match_update", (data) => {
        if (data.productId === id) {
          setPriceMatchStatus(data.status)
          setPriceMatchLoading(false)

          if (data.status === "accepted") {
            alert(`Your price match request has been accepted! New price: $${data.price}`)
            // No need to update product price here anymore
          } else if (data.status === "rejected") {
            alert("Your price match request has been rejected by the farmer.")
          } else if (data.status === "expired") {
            alert("Your price match request has expired without a response.")
          }
        }
      })

      return () => {
        socket.off("bargain_update")
        socket.off("bundle_update")
        socket.off("price_match_update")
      }
    }
  }, [socket, id])

  const handleBargainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !product.farmer) return

    setBargainLoading(true)

    try {
      console.log("Adding product to cart before bargain request")
      // First add to cart using the context function
      await addToCart(product._id, 1)
      console.log("Product added to cart successfully")

      console.log("Sending bargain request with price:", bargainPrice)
      // Then create bargain request
      const response = await api.post("/requests/bargain", {
        productId: product._id,
        farmerId: product.farmer._id,
        offeredPrice: Number.parseFloat(bargainPrice),
      })
      console.log("Bargain request response:", response.data)

      setBargainStatus("pending")
      alert("Bargain request sent! Waiting for farmer response...")
    } catch (err: any) {
      console.error("Error in bargain request:", err)
      setBargainStatus("error")
      alert(err.response?.data?.message || "Failed to send bargain request.")
    } finally {
      setBargainLoading(false)
    }
  }

  const handleBundleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !product.farmer) return

    setBundleLoading(true)

    try {
      console.log("Adding product to cart before bundle deal request")
      // First add to cart with the requested quantity
      await addToCart(product._id, bundleQuantity)
      console.log("Product added to cart successfully")

      console.log("Sending bundle deal request with quantity:", bundleQuantity)
      // Then create bundle deal request
      const response = await api.post("/requests/bundle", {
        productId: product._id,
        farmerId: product.farmer._id,
        quantity: bundleQuantity,
        offeredPrice: bundlePrice ? Number.parseFloat(bundlePrice) : null,
      })
      console.log("Bundle deal request response:", response.data)

      setBundleStatus("pending")
      alert("Bundle deal request sent! Waiting for farmer response...")
    } catch (err: any) {
      console.error("Error in bundle deal request:", err)
      setBundleStatus("error")
      alert(err.response?.data?.message || "Failed to send bundle deal request.")
    } finally {
      setBundleLoading(false)
    }
  }

  const handlePriceMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !product.farmer || !selectedCompetitor) return

    setPriceMatchLoading(true)

    try {
      const competitor = similarProducts.find((p) => p._id === selectedCompetitor)

      if (!competitor || !competitor.farmer) {
        throw new Error("Selected competitor not found or has no farmer information")
      }

      console.log("Adding product to cart before price match request")
      // First add to cart
      await addToCart(product._id, 1)
      console.log("Product added to cart successfully")

      console.log("Sending price match request with competitor price:", competitor.price)
      // Then create price match request
      const response = await api.post("/requests/price-match", {
        productId: product._id,
        farmerId: product.farmer._id,
        competitorId: competitor._id, // Fixed: Now sending the competitor product ID
        competitorPrice: competitor.price,
      })
      console.log("Price match request response:", response.data)

      setPriceMatchStatus("pending")
      alert("Price match request sent! Waiting for farmer response...")
    } catch (err: any) {
      console.error("Error in price match request:", err)
      setPriceMatchStatus("error")
      alert(err.response?.data?.message || "Failed to send price match request.")
    } finally {
      setPriceMatchLoading(false)
    }
  }

  // Handle regular add to cart
  const handleAddToCart = async () => {
    if (!product) return

    try {
      await addToCart(product._id, quantity)
      alert("Product added to cart!")
    } catch (err: any) {
      console.error("Error adding to cart:", err)
      alert(err.response?.data?.message || "Failed to add product to cart.")
    }
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Product not found.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <div className="h-64 md:h-full bg-gray-200 flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No image available</span>
              )}
            </div>
          </div>
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>

            {/* Add the rating display in the product details section */}
            <div className="mb-4">
              <span className="text-2xl font-bold text-green-600">
                ${product.price.toFixed(2)} / {product.unit}
              </span>
              <div className="mt-1">
                <StarRating rating={product.averageRating || 0} reviewCount={product.reviewCount || 0} size="lg" />
              </div>
            </div>

            {/* In the product details section, add category display */}
            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-semibold">Farmer:</span> {product.farmer ? product.farmer.name : "Unknown Farmer"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Category:</span> {product.category || "Other"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Available Stock:</span> {product.stock} {product.unit}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                Quantity:
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-l"
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(product.stock, Math.max(1, Number.parseInt(e.target.value) || 1)))
                  }
                  className="w-16 text-center py-2 border-t border-b border-gray-300"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.farmer && (
                <>
                  <button
                    onClick={() => {
                      setShowBargainForm(!showBargainForm)
                      setShowBundleForm(false)
                      setShowPriceMatchForm(false)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Bargain Price
                  </button>

                  <button
                    onClick={() => {
                      setShowBundleForm(!showBundleForm)
                      setShowBargainForm(false)
                      setShowPriceMatchForm(false)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Bundle Deal
                  </button>

                  {similarProducts.length > 0 && (
                    <button
                      onClick={() => {
                        setShowPriceMatchForm(!showPriceMatchForm)
                        setShowBargainForm(false)
                        setShowBundleForm(false)
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Price Match
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleAddToCart}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add to Cart
              </button>
            </div>

            {/* Bargain Form */}
            {showBargainForm && product.farmer && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Make a Bargain Offer</h3>
                <form onSubmit={handleBargainSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bargainPrice">
                      Your Offer Price (per {product.unit}):
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-700 mr-2">$</span>
                      <input
                        id="bargainPrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={product.price - 0.01}
                        value={bargainPrice}
                        onChange={(e) => setBargainPrice(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                    disabled={bargainLoading || bargainStatus === "pending"}
                  >
                    {bargainLoading
                      ? "Sending..."
                      : bargainStatus === "pending"
                        ? "Awaiting Response..."
                        : "Send Bargain Request"}
                  </button>
                  {bargainStatus === "pending" && (
                    <p className="text-sm text-gray-600 mt-2">
                      Your request has been sent. The farmer has 1 hour to respond.
                    </p>
                  )}
                </form>
              </div>
            )}

            {/* Bundle Deal Form */}
            {showBundleForm && product.farmer && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Request Bundle Deal</h3>
                <form onSubmit={handleBundleDealSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bundleQuantity">
                      Quantity:
                    </label>
                    <input
                      id="bundleQuantity"
                      type="number"
                      min="5"
                      max={product.stock}
                      value={bundleQuantity}
                      onChange={(e) => setBundleQuantity(Number.parseInt(e.target.value) || 5)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bundlePrice">
                      Your Offer Price (per {product.unit}) (optional):
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-700 mr-2">$</span>
                      <input
                        id="bundlePrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={product.price - 0.01}
                        value={bundlePrice}
                        onChange={(e) => setBundlePrice(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave blank to let the farmer suggest a discount.</p>
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full"
                    disabled={bundleLoading || bundleStatus === "pending"}
                  >
                    {bundleLoading
                      ? "Sending..."
                      : bundleStatus === "pending"
                        ? "Awaiting Response..."
                        : "Request Bundle Deal"}
                  </button>
                  {bundleStatus === "pending" && (
                    <p className="text-sm text-gray-600 mt-2">
                      Your request has been sent. The farmer has 1 hour to respond.
                    </p>
                  )}
                </form>
              </div>
            )}

            {/* Price Match Form */}
            {showPriceMatchForm && product.farmer && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Request Price Match</h3>
                {similarProducts.length > 0 ? (
                  <form onSubmit={handlePriceMatchSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="competitor">
                        Select Competitor:
                      </label>
                      <select
                        id="competitor"
                        value={selectedCompetitor}
                        onChange={(e) => setSelectedCompetitor(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="">-- Select a competitor --</option>
                        {similarProducts.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} - ${p.price.toFixed(2)} by {p.farmer ? p.farmer.name : "Unknown Farmer"} (per{" "}
                            {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded w-full"
                      disabled={priceMatchLoading || priceMatchStatus === "pending" || !selectedCompetitor}
                    >
                      {priceMatchLoading
                        ? "Sending..."
                        : priceMatchStatus === "pending"
                          ? "Awaiting Response..."
                          : "Request Price Match"}
                    </button>
                    {priceMatchStatus === "pending" && (
                      <p className="text-sm text-gray-600 mt-2">
                        Your request has been sent. The farmer has 1 hour to respond.
                      </p>
                    )}
                  </form>
                ) : (
                  <p className="text-gray-600">
                    No similar products with the same unit ({product.unit}) are available for price matching.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Similar Products from Other Farmers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-green-600 font-bold">
                      ${product.price.toFixed(2)} / {product.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      By: {product.farmer ? product.farmer.name : "Unknown Farmer"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/product/${product._id}`}
                      className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Customer Reviews</h2>
        <ProductReviews productId={product._id} refreshTrigger={refreshReviews} />
      </div>
    </div>
  )
}

export default ProductDetails
