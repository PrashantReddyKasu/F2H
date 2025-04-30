"use client"

import type React from "react"

import { useState } from "react"
import api from "../services/api"

interface ReviewFormProps {
  productId: string
  orderId: string
  productName: string
  onReviewSubmitted: () => void
}

const ReviewForm = ({ productId, orderId, productName, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/reviews", {
        productId,
        orderId,
        rating,
        comment,
      })

      setComment("")
      setRating(5)
      onReviewSubmitted()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Review {productName}</h3>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Rating</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="text-2xl focus:outline-none">
                {star <= rating ? <span className="text-yellow-400">★</span> : <span className="text-gray-300">★</span>}
              </button>
            ))}
            <span className="ml-2 text-gray-600">{rating} of 5</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
            Your Review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            required
            placeholder="Share your experience with this product..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  )
}

export default ReviewForm
