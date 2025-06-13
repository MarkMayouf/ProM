import React, { useState } from 'react';
import { Card, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaEye, FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../assets/styles/moores-card.css';

const UniversalProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  isInWishlist = false,
  showQuickView = true,
  showWishlist = true,
  showAddToCart = true,
  showViewDetails = true,
  cardStyle = 'default', // 'default', 'compact', 'detailed'
  categoryColor = '#007bff'
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate discount percentage
  const discountPercentage = product.regularPrice && product.price < product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : 0;

  // Render star rating
  const renderRating = (rating, numReviews) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="moores-rating-star filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="moores-rating-star half" />);
      } else {
        stars.push(<FaRegStar key={i} className="moores-rating-star empty" />);
      }
    }
    
    return (
      <div className="moores-product-rating">
        <div className="moores-rating-stars">{stars}</div>
        {numReviews > 0 && (
          <span className="moores-rating-count">({numReviews})</span>
        )}
      </div>
    );
  };

  // Get stock status
  const getStockStatus = () => {
    if (product.countInStock === 0) {
      return { text: 'Out of Stock', className: 'moores-out-of-stock' };
    } else if (product.countInStock <= 5) {
      return { text: `Only ${product.countInStock} left`, className: 'moores-low-stock' };
    }
    return { text: 'In Stock', className: 'moores-in-stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <div 
      className="moores-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="moores-product-image-container">
        {/* Badges */}
        <div className="moores-product-badges">
          {discountPercentage > 0 && (
            <Badge className="moores-badge moores-badge-sale">
              -{discountPercentage}%
            </Badge>
          )}
          {product.isNew && (
            <Badge className="moores-badge moores-badge-new">
              New
            </Badge>
          )}
          {product.isBestseller && (
            <Badge className="moores-badge moores-badge-bestseller">
              Bestseller
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="moores-product-actions">
          {showWishlist && (
            <button
              className={`moores-action-btn ${isInWishlist ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist && onToggleWishlist(product);
              }}
              title="Add to Wishlist"
            >
              {isInWishlist ? <FaHeart /> : <FaRegHeart />}
            </button>
          )}
          
          {showQuickView && (
            <button
              className="moores-action-btn"
              onClick={(e) => {
                e.preventDefault();
                onQuickView && onQuickView(product);
              }}
              title="Quick View"
            >
              <FaEye />
            </button>
          )}
        </div>

        {/* Product Image */}
        <Link to={`/product/${product._id}`} className="moores-product-link">
          <img
            src={imageError ? '/images/placeholder.jpg' : product.image}
            alt={product.name}
            className="moores-product-image"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {imageLoading && (
            <div className="moores-image-skeleton">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Product Info */}
      <div className="moores-product-info">
        {/* Brand */}
        {product.brand && (
          <div className="moores-product-brand">{product.brand}</div>
        )}

        {/* Product Title */}
        <Link to={`/product/${product._id}`} className="moores-product-title-link">
          <h3 className="moores-product-title">{product.name}</h3>
        </Link>

        {/* Rating */}
        {product.rating && renderRating(product.rating, product.numReviews)}

        {/* Price */}
        <div className="moores-product-price">
          <span className="moores-current-price">${product.price?.toFixed(2)}</span>
          {product.regularPrice && product.regularPrice > product.price && (
            <>
              <span className="moores-original-price">${product.regularPrice.toFixed(2)}</span>
              <span className="moores-discount-amount">
                Save ${(product.regularPrice - product.price).toFixed(2)}
              </span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <div className="moores-product-availability">
          <span className={stockStatus.className}>{stockStatus.text}</span>
        </div>

        {/* Action Buttons */}
        <div className="moores-product-buttons">
          {showAddToCart && (
            <button
              className="moores-btn-primary"
              disabled={product.countInStock === 0}
              onClick={(e) => {
                e.preventDefault();
                onAddToCart && onAddToCart(product);
              }}
            >
              <FaShoppingCart className="me-2" />
              {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}

          {showViewDetails && (
            <Link to={`/product/${product._id}`} className="text-decoration-none">
              <button className="moores-btn-outline">
                View Details
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalProductCard; 