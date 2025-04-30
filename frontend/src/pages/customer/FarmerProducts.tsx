"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/LoadingSpinner"
import StarRating from "../../components/StarRating"

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

interface Farmer {
  _id: string
  name: string
  address?: string
  phoneNumber?: string
  location?: {
    coordinates: [number, number]
    address?: string
  }
}

const FarmerProducts = () => {
  const { farmerId } = useParams<{ farmerId: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchFarmerAndProducts = async () => {
      try {
        setLoading(true)
        setError("")

        // Fetch farmer details
        const farmerResponse = await api.get(`/auth/users/${farmerId}`)
        setFarmer(farmerResponse.data)

        // Fetch farmer's products
        const productsResponse = await api.get(`/products/farmer/${farmerId}`)
        setProducts(productsResponse.data)
      } catch (err: any) {
        console.error("Error fetching farmer data:", err)
        setError(err.response?.data?.message || "Failed to load farmer information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (farmerId) {
      fetchFarmerAndProducts()
    }
  }, [farmerId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          {farmer ? `${farmer.name}'s Products` : "Farmer Products"}
        </h1>
        <div className="flex gap-2">
          <Link
            to="/nearby-farmers"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Back to Map
          </Link>
          <Link
            to="/customer/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            All Products
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {farmer && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{farmer.name}</h2>
          {farmer.location?.address && (
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Address:</span> {farmer.location.address}
            </p>
          )}
          {farmer.phoneNumber && (
            <p className="text-gray-600">
              <span className="font-medium">Contact:</span> {farmer.phoneNumber}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Products</h2>

        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">This farmer doesn't have any products available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden border">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
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
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mb-2">
                    {product.category || "Other"}
                  </span>
                  <p className="text-gray-600 mt-2">{product.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-green-600 font-bold">
                      ${product.price.toFixed(2)} / {product.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock} {product.unit}
                    </span>
                  </div>
                  <div className="mt-1 mb-2">
                    <StarRating rating={product.averageRating || 0} reviewCount={product.reviewCount || 0} size="sm" />
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
        )}
      </div>
    </div>
  )
}

export default FarmerProducts
