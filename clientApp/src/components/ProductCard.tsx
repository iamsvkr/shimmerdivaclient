import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Item } from '../api/items'
import { useAppDispatch } from '../app/hooks'
import { addToCart } from '../features/cart/cartSlice'

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

interface ProductCardProps {
  item: Item
  onAddToCart: (message: string) => void
}

export default function ProductCard({ item, onAddToCart }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const hasImages = item.images && item.images.length > 0
  const currentImage = hasImages ? item.images?.[currentImageIndex] : null

  const discount = item.discountPrice && item.price > item.discountPrice
    ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
    : 0

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) =>
      prev === 0 ? item.images!.length - 1 : prev - 1
    )
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) =>
      prev === item.images!.length - 1 ? 0 : prev + 1
    )
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(
      addToCart({
        itemId: item.id,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        imageUrl: item.images?.[0]?.imageUrl,
        quantity: 1,
      }),
    )
    onAddToCart(`${item.name} added to cart`)
  }

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/item/${item.id}`, { state: { item } })}
    >
      <div className="product-image-wrap">
        {hasImages ? (
          <>
            <img src={currentImage!.imageUrl} alt={item.name} />
            
            {/* Navigation Buttons */}
            {item.images!.length > 1 && (
              <>
                <button
                  className="slideshow-nav slideshow-nav-prev"
                  onClick={handlePrevImage}
                  title="Previous image"
                >
                  ‹
                </button>
                <button
                  className="slideshow-nav slideshow-nav-next"
                  onClick={handleNextImage}
                  title="Next image"
                >
                  ›
                </button>
              </>
            )}

            {/* Image Indicators */}
            {item.images!.length > 1 && (
              <div className="slideshow-indicators">
                {item.images!.map((_, idx) => (
                  <div
                    key={idx}
                    className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="product-placeholder">💎</div>
        )}

        {discount > 0 && (
          <span className="product-badge sale">{discount}% OFF</span>
        )}
        <button className="product-wishlist" onClick={(e) => e.stopPropagation()}>
          🤍
        </button>
      </div>

      <div className="product-info">
        {item.category && (
          <div className="product-category">{item.category}</div>
        )}
        <div className="product-name">{item.name}</div>
        {item.material && item.material !== 'NA' && (
          <div className="product-material">{item.material}</div>
        )}
        {item.averageRating ? (
          <div className="product-rating">
            <span className="stars">{stars(Math.round(item.averageRating))}</span>
            <span className="rating-count">({item.reviewCount})</span>
          </div>
        ) : null}
        <div className="product-price">
          <span className="price-current">
            ₹{(item.discountPrice ?? item.price).toLocaleString()}
          </span>
          {discount > 0 && (
            <span className="price-original">₹{item.price.toLocaleString()}</span>
          )}
          {discount > 0 && (
            <span className="price-save">Save {discount}%</span>
          )}
        </div>
        <button
          className="product-add-btn"
          onClick={handleAddToCart}
        >
          <span>🛍</span> Add to Cart
        </button>
      </div>
    </div>
  )
}
