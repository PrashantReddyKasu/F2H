"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
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

const CustomerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Fetching products...")
        const response = await api.get("/products")
        console.log("Products response:", response.data)
        setProducts(response.data)
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setError("Failed to load products. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/products/categories")
        setCategories(response.data)
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }

    fetchCategories()
  }, [])

  const filteredProducts = products.filter(
    (product) =>
      (selectedCategory === "" || product.category === selectedCategory) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Available Products</h1>
        <Link
          to="/nearby-farmers"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Find Nearby Farmers
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <div className="w-full md:w-1/3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found. Please try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    By:{" "}
                    {product.farmer ? (
                      <Link to={`/farmer/${product.farmer._id}/products`} className="hover:underline">
                        {product.farmer.name}
                      </Link>
                    ) : (
                      "Unknown Farmer"
                    )}
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
  )
}

export default CustomerDashboard
