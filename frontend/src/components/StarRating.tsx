interface StarRatingProps {
  rating: number
  reviewCount?: number
  size?: "sm" | "md" | "lg"
}

const StarRating = ({ rating, reviewCount, size = "md" }: StarRatingProps) => {
  // Convert rating to nearest half star
  const roundedRating = Math.round(rating * 2) / 2

  const sizeClasses = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-xl",
  }

  return (
    <div className="flex items-center">
      <div className={`flex text-yellow-400 ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= roundedRating) {
            return <span key={star}>★</span>
          } else if (star - 0.5 === roundedRating) {
            return <span key={star}>★</span>
          } else {
            return (
              <span key={star} className="text-gray-300">
                ★
              </span>
            )
          }
        })}
      </div>
      {reviewCount !== undefined && (
        <span className={`ml-1 text-gray-500 ${size === "sm" ? "text-xs" : "text-sm"}`}>({reviewCount})</span>
      )}
    </div>
  )
}

export default StarRating
