import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaEye, FaShoppingCart, FaStar } from 'react-icons/fa';
import { getFullImageUrl } from '../utils/imageUtils';

const MooresProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  isInWishlist = false,
  showQuickView = true,
  showWishlist = true,
  showAddToCart = true,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Check if product is a suit - comprehensive detection
  const suitCategories = ['Suits', 'Tuxedos', 'Blazers'];
  const suitKeywords = ['suit', 'tuxedo', 'blazer'];
  
  const isSuit = suitCategories.includes(product.category) ||
                 (product.category && suitKeywords.some(keyword => 
                   product.category.toLowerCase().includes(keyword)
                 )) ||
                 (product.name && suitKeywords.some(keyword => 
                   product.name.toLowerCase().includes(keyword)
                 ));

  // Calculate discount percentage
  const discountPercentage = product.regularPrice && product.price < product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : 0;

  // Calculate sale price if available
  const salePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : null;
  const finalDiscountPercentage = salePrice 
    ? Math.round(((product.price - salePrice) / product.price) * 100)
    : discountPercentage;

  // Render star rating
  const renderRating = (rating, numReviews) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="moores-rating-star" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStar key={i} className="moores-rating-star" style={{ opacity: 0.5 }} />);
      } else {
        stars.push(<FaStar key={i} className="moores-rating-star empty" />);
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
      return { status: 'out-of-stock', text: 'Out of Stock' };
    } else if (product.countInStock <= 5) {
      return { status: 'low-stock', text: `Only ${product.countInStock} left` };
    } else {
      return { status: 'in-stock', text: 'In Stock' };
    }
  };

  const stockStatus = getStockStatus();

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <>
      <div className="moores-product-card">
        {/* Product Image Container */}
        <div className="moores-product-image-container">
          <Link to={`/product/${product._id}`}>
            {imageLoading && (
              <div className="moores-loading-container">
                <div className="moores-loading-spinner"></div>
              </div>
            )}
            <img
              src={imageError ? '/images/sample.jpg' : getFullImageUrl(product.image)}
              alt={product.name}
              className="moores-product-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </Link>

          {/* Product Badges */}
          <div className="moores-product-badges">
            {finalDiscountPercentage > 0 && (
              <span className="moores-badge moores-badge-sale">
                -{finalDiscountPercentage}%
              </span>
            )}
            {product.isNew && (
              <span className="moores-badge moores-badge-new">
                New
              </span>
            )}
            {product.isBestseller && (
              <span className="moores-badge moores-badge-bestseller">
                Bestseller
              </span>
            )}
          </div>

          {/* Product Actions */}
          <div className="moores-product-actions">
            {showWishlist && (
              <button
                className={`moores-action-btn ${isInWishlist ? 'active' : ''}`}
                onClick={() => onToggleWishlist(product)}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                {isInWishlist ? <FaHeart /> : <FaRegHeart />}
              </button>
            )}
            {showQuickView && (
              <button
                className="moores-action-btn"
                onClick={() => onQuickView(product)}
                title="Quick View"
              >
                <FaEye />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="moores-product-info">
          {/* Brand */}
          {product.brand && (
            <div className="moores-product-brand">
              {product.brand}
            </div>
          )}

          {/* Product Title */}
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <h3 className="moores-product-title">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.rating > 0 && renderRating(product.rating, product.numReviews)}

          {/* Price */}
          <div className="moores-product-price">
            <span className="moores-current-price">
              ${salePrice ? salePrice.toFixed(2) : product.price.toFixed(2)}
            </span>
            {(salePrice || product.regularPrice > product.price) && (
              <span className="moores-original-price">
                ${(salePrice ? product.price : product.regularPrice).toFixed(2)}
              </span>
            )}
            {finalDiscountPercentage > 0 && (
              <span className="moores-discount-amount">
                Save ${((salePrice ? product.price - salePrice : product.regularPrice - product.price)).toFixed(2)}
              </span>
            )}
          </div>

          {/* Availability */}
          <div className="moores-product-availability">
            <span className={`moores-${stockStatus.status}`}>
              {stockStatus.text}
            </span>
          </div>

          {/* Product Buttons */}
          <div className="moores-product-buttons">
            {showAddToCart && (
              <button
                className="moores-btn-primary"
                onClick={() => onAddToCart(product)}
                disabled={product.countInStock === 0}
                title={product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              >
                <FaShoppingCart style={{ marginRight: '0.5rem' }} />
                {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Removed SuitCustomizer Modal - using direct add to cart instead */}
    </>
  );
};

export default MooresProductCard; 