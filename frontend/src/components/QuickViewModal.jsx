import React, { useState } from 'react';
import {
  Modal,
  Row,
  Col,
  Image,
  Button,
  Badge,
  Form,
  Card,
  ListGroup,
  Alert
} from 'react-bootstrap';
import {
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaEye,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaMinus,
  FaPlus,
  FaRuler,
  FaInfoCircle,
  FaShippingFast,
  FaExchangeAlt,
  FaShieldAlt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '../utils/imageUtils';
import ProductImageGallery from './ProductImageGallery';

const QuickViewModal = ({ 
  show, 
  onHide, 
  product, 
  onAddToCart, 
  onToggleWishlist 
}) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);
  
  const isInWishlist = wishlistItems.some(item => item._id === product?._id);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (show && product) {
      setSelectedSize('');
      setSelectedColor(null);
      setQuantity(1);
      setSelectedImageIndex(0);
    }
  }, [show, product]);

  if (!product) return null;

  // Product images array
  const productImages = product.images && product.images.length > 0 
    ? [product.image, ...product.images]
    : [product.image];

  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('Please select a size');
      return;
    }

    const cartItem = {
      ...product,
      selectedSize,
      selectedColor,
      qty: quantity
    };

    dispatch(addToCart(cartItem));
    toast.success(`${product.name || product.customTitle} added to cart!`);
    onHide();
  };

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    dispatch(toggleWishlistItem({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      brand: product.brand,
      category: product.category
    }));

    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Handle quantity changes
  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  // Handle size change
  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  // Render star rating
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-muted" />);
    }

    return stars;
  };

  // Check if size is available
  const isSizeAvailable = (sizeValue) => {
    if (!product.sizes) return true;
    
    // Handle both string arrays and object arrays
    const sizeItem = product.sizes.find(s => {
      if (typeof s === 'string') {
        return s === sizeValue;
      }
      return s.size === sizeValue;
    });
    
    if (!sizeItem) return false;
    
    // If it's a string, assume it's available
    if (typeof sizeItem === 'string') return true;
    
    // If it's an object, check quantity
    return sizeItem.quantity > 0;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      className="quick-view-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <FaEye className="me-2 text-primary" />
          Quick View
        </Modal.Title>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          className="btn-close-custom"
        >
          <FaTimes />
        </Button>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Row>
          {/* Product Images */}
          <Col md={6}>
            <div className="quick-view-images">
              <ProductImageGallery
                mainImage={product.image}
                images={product.images || []}
                productName={product.name || product.customTitle}
                showThumbnails={true}
                maxThumbnails={4}
                className="quick-view-gallery"
              />
            </div>
          </Col>

          {/* Product Details */}
          <Col md={6}>
            <div className="quick-view-details">
              {/* Product Title and Price */}
              <div className="product-header mb-3">
                <h3 className="product-title mb-2">
                  {product.name || product.customTitle}
                </h3>
                
                <div className="product-meta mb-3">
                  {product.brand && (
                    <Badge bg="secondary" className="me-2">{product.brand}</Badge>
                  )}
                  {product.category && (
                    <Badge bg="info" className="me-2">{product.category}</Badge>
                  )}
                  {product.rating && (
                    <div className="d-inline-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <span>{product.rating} ({product.numReviews || 0} reviews)</span>
                    </div>
                  )}
                </div>
                
                <div className="price-section mb-3">
                  <h4 className="current-price text-primary mb-1">
                    ${product.price?.toFixed(2) || '0.00'}
                  </h4>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="original-price text-muted text-decoration-line-through">
                      ${product.originalPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="product-description mb-3">
                  <p className="text-muted">{product.description}</p>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="size-selection mb-3">
                  <h6 className="mb-2">Size:</h6>
                  <div className="size-options d-flex flex-wrap gap-2">
                    {product.sizes.map((sizeItem, index) => {
                      // Handle both string arrays and object arrays
                      const sizeValue = typeof sizeItem === 'string' ? sizeItem : sizeItem.size;
                      const sizeQuantity = typeof sizeItem === 'object' ? sizeItem.quantity : null;
                      const isAvailable = sizeQuantity === null || sizeQuantity > 0;
                      const sizeKey = typeof sizeItem === 'string' ? sizeItem : (sizeItem._id || `${sizeItem.size}-${index}`);
                      
                      return (
                        <Button
                          key={sizeKey}
                          variant={selectedSize === sizeValue ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => handleSizeChange(sizeValue)}
                          className="size-btn"
                          disabled={!isAvailable}
                          title={!isAvailable ? 'Out of stock' : `${sizeValue}${sizeQuantity ? ` (${sizeQuantity} available)` : ''}`}
                        >
                          {sizeValue}
                          {sizeQuantity !== null && sizeQuantity <= 5 && sizeQuantity > 0 && (
                            <small className="d-block text-muted" style={{fontSize: '0.7rem', lineHeight: '1'}}>
                              {sizeQuantity} left
                            </small>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="color-selection mb-3">
                  <h6 className="mb-2">Color:</h6>
                  <div className="color-options d-flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <div
                        key={color.name}
                        className={`color-option ${selectedColor?.name === color.name ? 'selected' : ''}`}
                        onClick={() => handleColorChange(color)}
                        style={{
                          backgroundColor: color.hex,
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: selectedColor?.name === color.name ? '3px solid #007bff' : '2px solid #ddd',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  {selectedColor && (
                    <small className="text-muted mt-1 d-block">
                      Selected: {selectedColor.name}
                    </small>
                  )}
                </div>
              )}

              {/* Quantity Selection */}
              <div className="quantity-selection mb-4">
                <h6 className="mb-2">Quantity:</h6>
                <Form.Select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{ maxWidth: '100px' }}
                >
                  {[...Array(Math.min(product.countInStock || 10, 10)).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>
                      {x + 1}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Stock Status */}
              <div className="stock-status mb-3">
                {product.countInStock > 0 ? (
                  <Alert variant="success" className="py-2">
                    <small>✓ In Stock ({product.countInStock} available)</small>
                  </Alert>
                ) : (
                  <Alert variant="danger" className="py-2">
                    <small>✗ Out of Stock</small>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Row>
                  <Col>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 mb-2"
                      onClick={handleAddToCart}
                      disabled={product.countInStock === 0}
                    >
                      <FaShoppingCart className="me-2" />
                      Add to Cart
                    </Button>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Button
                      variant="outline-secondary"
                      className="w-100"
                      onClick={handleWishlistToggle}
                    >
                      {isInWishlist ? <FaHeart /> : <FaRegHeart />}
                    </Button>
                  </Col>
                  <Col md={6}>
                    {/* Only show Customize button for customizable categories */}
                    {['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts'].includes(product?.category) ? (
                      <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={() => {
                          // Navigate to full product page for customization
                          window.location.href = `/product/${product._id || product.id}`;
                        }}
                      >
                        <FaRuler className="me-2" />
                        Customize
                      </Button>
                    ) : (
                      <Button
                        variant="outline-info"
                        className="w-100"
                        onClick={() => {
                          // Don't navigate for combination items with fake IDs
                          if (product.isCombinationItem || (product._id && (product._id.startsWith('combo-') || product._id.startsWith('temp-')))) {
                            // Show a message that this is a combination item
                            toast.info('This is a combination item. Add to cart or view the complete combination details.');
                            return;
                          }
                          // Navigate to full product page for real products
                          window.location.href = `/product/${product._id || product.id}`;
                        }}
                      >
                        <FaInfoCircle className="me-2" />
                        {product.isCombinationItem ? 'Combination Item' : 'View Details'}
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <div className="w-100 d-flex justify-content-between align-items-center">
          {/* Only show the link for real products, not combination items */}
          {product.isCombinationItem || (product._id && (product._id.startsWith('combo-') || product._id.startsWith('temp-'))) ? (
            <Button 
              variant="outline-secondary"
              onClick={() => {
                toast.info('This is a combination item from the Perfect Combinations section.');
                onHide();
              }}
            >
              <FaInfoCircle className="me-2" />
              Combination Item
            </Button>
          ) : (
          <Link 
            to={`/product/${product._id}`}
            className="btn btn-outline-primary"
            onClick={onHide}
          >
            <FaInfoCircle className="me-2" />
            View Full Details
          </Link>
          )}
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Footer>

      <style jsx>{`
        :root {
          --primary-color: #1a2c42;
          --secondary-color: #2c5282;
          --accent-color: #3182ce;
          --success-color: #38a169;
          --warning-color: #d69e2e;
          --danger-color: #e53e3e;
          --light-bg: #f7fafc;
          --card-shadow: 0 4px 20px rgba(26, 44, 66, 0.08);
          --card-shadow-hover: 0 8px 30px rgba(26, 44, 66, 0.15);
          --border-radius: 12px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quick-view-modal .modal-dialog {
          max-width: 1200px;
        }
        
        .quick-view-modal .modal-content {
          border-radius: var(--border-radius);
          border: none;
          box-shadow: 0 20px 60px rgba(26, 44, 66, 0.15);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .quick-view-modal .modal-header {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          padding: 1.5rem;
        }
        
        .quick-view-modal .modal-title {
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
        }
        
        .btn-close-custom {
          border-radius: 50%;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transition: var(--transition);
          backdrop-filter: blur(10px);
        }
        
        .btn-close-custom:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .product-title {
          color: var(--primary-color);
          font-weight: 700;
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }
        
        .product-meta .badge {
          font-size: 0.8rem;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
        }
        
        .current-price {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-color);
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .original-price {
          font-size: 1.2rem;
          color: #6c757d;
        }
        
        .size-btn {
          min-width: 55px;
          height: 45px;
          border-radius: var(--border-radius);
          transition: var(--transition);
          font-weight: 600;
          border: 2px solid var(--primary-color);
          background: transparent;
          color: var(--primary-color);
          position: relative;
          overflow: hidden;
        }
        
        .size-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          transition: var(--transition);
          z-index: -1;
        }
        
        .size-btn:hover::before,
        .size-btn.btn-primary::before {
          left: 0;
        }
        
        .size-btn:hover,
        .size-btn.btn-primary {
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 44, 66, 0.2);
        }
        
        .color-option {
          transition: var(--transition);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .color-option:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .color-option.selected {
          transform: scale(1.1);
          box-shadow: 0 0 0 4px var(--accent-color);
        }
        
        .action-buttons .btn {
          border-radius: var(--border-radius);
          font-weight: 600;
          transition: var(--transition);
          padding: 0.75rem 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .action-buttons .btn-primary {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          border: none;
          box-shadow: 0 4px 15px rgba(26, 44, 66, 0.2);
        }
        
        .action-buttons .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(26, 44, 66, 0.3);
          background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
        }
        
        .action-buttons .btn-outline-secondary {
          border: 2px solid #6c757d;
          color: #6c757d;
        }
        
        .action-buttons .btn-outline-secondary:hover {
          background: #6c757d;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 117, 125, 0.2);
        }
        
        .action-buttons .btn-outline-primary {
          border: 2px solid var(--primary-color);
          color: var(--primary-color);
        }
        
        .action-buttons .btn-outline-primary:hover {
          background: var(--primary-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 44, 66, 0.2);
        }
        
        .quick-view-gallery {
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--card-shadow);
        }
        
        .quick-view-details {
          padding: 1rem;
        }
        
        .stock-status .alert {
          border-radius: var(--border-radius);
          border: none;
          font-weight: 600;
        }
        
        .stock-status .alert-success {
          background: linear-gradient(135deg, var(--success-color), #48bb78);
          color: white;
        }
        
        .stock-status .alert-danger {
          background: linear-gradient(135deg, var(--danger-color), #f56565);
          color: white;
        }
        
        @media (max-width: 768px) {
          .quick-view-modal .modal-dialog {
            margin: 1rem;
          }
          
          .action-buttons .btn {
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
          }
          
          .product-title {
            font-size: 1.5rem;
          }
          
          .current-price {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </Modal>
  );
};

export default QuickViewModal; 