"use client"

import { useEffect, useState } from "react"
import api from "../services/api"
import LoadingSpinner from "./LoadingSpinner"

interface Review {
  _id: string
  rating: number
  comment: string
  createdAt: string
  customer: {
    _id: string
    name: string
    profileImage?: string
  }
}

interface ProductReviewsProps {
  productId: string
  refreshTrigger?: number
}

const ProductReviews = ({ productId, refreshTrigger = 0 }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/reviews/product/${productId}`)
        setReviews(response.data)
        setError("")
      } catch (err: any) {
        console.error("Error fetching reviews:", err)
        setError("Failed to load reviews")
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [productId, refreshTrigger])

  if (loading) return <LoadingSpinner />

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
  }

  if (reviews.length === 0) {
    return <div className="text-center py-4 text-gray-500">No reviews yet. Be the first to review this product!</div>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0 mr-3">
              {review.customer.profileImage ? (
                <img
                  src={review.customer.profileImage || "/placeholder.svg"}
                  alt={review.customer.name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
                  {review.customer.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{review.customer.name}</h4>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{star <= review.rating ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-700 mt-2">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}

export default ProductReviews
