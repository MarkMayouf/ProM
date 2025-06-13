import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Card, Button, Badge, Alert, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaShoppingCart, 
  FaRegHeart, 
  FaHeart, 
  FaArrowLeft, 
  FaTag, 
  FaFire, 
  FaClock, 
  FaFilter, 
  FaSort, 
  FaSearch, 
  FaEye,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import QuickViewModal from '../components/QuickViewModal';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '../utils/imageUtils';
import { prepareProductForCart, getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';
import { useScrollToTop } from '../hooks/useScrollToTop';
import '../assets/styles/sale.css';
import '../assets/styles/moores-style.css';

const SaleScreen = () => {
  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // State for filters and sorting
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('discount');
  const [searchTerm, setSearchTerm] = useState('');

  // Query parameters for sale products
  const { data, isLoading, error } = useGetProductsQuery({
    sale: 'true' // Use backend sale filter
  });
  const [saleProducts, setSaleProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 47,
    minutes: 59,
    seconds: 59
  });

  // Quick view state
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Set sale products from backend filtered data
  useEffect(() => {
    if (data && data.products) {
      // Additional frontend filtering to ensure only actual sale items are shown
      const actualSaleProducts = data.products.filter(product => {
        // Check if product has valid sale data
        // Fixed logic: If salePrice exists, compare it with regularPrice or price
        // If no salePrice, ensure regularPrice > price
        const hasValidSale = product.isOnSale && (
          (product.salePrice && product.regularPrice && product.salePrice < product.regularPrice) ||
          (product.salePrice && !product.regularPrice && product.salePrice < product.price) ||
          (!product.salePrice && product.regularPrice && product.price < product.regularPrice)
        );
        
        // Check if sale dates are valid (if they exist)
        const now = new Date();
        const saleStartValid = !product.saleStartDate || new Date(product.saleStartDate) <= now;
        const saleEndValid = !product.saleEndDate || new Date(product.saleEndDate) >= now;
        
        return hasValidSale && saleStartValid && saleEndValid;
      });
      
      setSaleProducts(actualSaleProducts);
      setFilteredProducts(actualSaleProducts);
    }
  }, [data]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...saleProducts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Apply sorting
    switch (sortBy) {
      case 'discount':
        filtered.sort((a, b) => {
          const discountA = calculateDiscount(a);
          const discountB = calculateDiscount(b);
          return discountB - discountA;
        });
        break;
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.rating * b.numReviews) - (a.rating * a.numReviews));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [saleProducts, searchTerm, selectedCategories, priceRange, sortBy]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        if (newSeconds < 0) {
          const newMinutes = prev.minutes - 1;
          if (newMinutes < 0) {
            const newHours = prev.hours - 1;
            if (newHours < 0) {
              clearInterval(timer);
              return { hours: 0, minutes: 0, seconds: 0 };
            }
            return { hours: newHours, minutes: 59, seconds: 59 };
          }
          return { ...prev, minutes: newMinutes, seconds: 59 };
        }
        return { ...prev, seconds: newSeconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Add to cart handler
  const handleAddToCart = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      navigate(`/product/${product._id}`, {
        state: { from: `/sale` },
      });
      toast.info('Please select a size before adding to cart');
      return;
    }

    // Use standardized price calculation for consistent cart pricing
    const cartProduct = prepareProductForCart(product, { qty: 1 });

    dispatch(addToCart(cartProduct));
    toast.success(`${product.name} added to cart at sale price!`, { autoClose: 2000 });
  };

  // Toggle wishlist handler
  const toggleWishlist = (product) => {
    dispatch(toggleWishlistItem({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      brand: product.brand,
      category: product.category
    }));
    
    const isInWishlist = wishlistItems.some(item => item._id === product._id);
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', { autoClose: 2000 });
  };

  // Calculate discount percentage - using standardized logic
  const calculateDiscount = (product) => {
    const priceInfo = getPriceDisplayInfo(product);
    return priceInfo.discountPercentage;
  };

  // Quick view handlers
  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setTimeout(() => {
      setQuickViewProduct(null);
    }, 300);
  };

  // Get unique categories
  const categories = [...new Set(saleProducts.map(product => product.category))];

  return (
    <>
      <Meta title="Flash Sale | ProMayouf" description="Limited time offers up to 70% off" />
      
      {/* Flash Sale Banner - Reduced Hero Style */}
      <section className="flash-sale-banner py-2 mb-3">
        <Container fluid>
          <div className="flash-sale-hero position-relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #dc3545 0%, #b02a37 50%, #8b1e2b 100%)',
                 borderRadius: '15px',
                 minHeight: '150px',
                 boxShadow: '0 15px 30px rgba(220, 53, 69, 0.25)',
                 border: '2px solid rgba(255, 255, 255, 0.1)'
               }}>
            
            {/* Background Pattern */}
            <div 
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3
              }}
            />

            <Container className="position-relative h-100">
              <Row className="align-items-center h-100 py-2">
                <Col lg={8} md={12}>
                  <div className="hero-content text-white">
                    {/* Navigation */}
                    <Link 
                      to="/" 
                      className="btn btn-light mb-3 shadow-sm d-inline-flex align-items-center"
                      style={{ 
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontWeight: '600',
                        border: 'none',
                        fontSize: '0.85rem'
                      }}
                    >
                      <FaArrowLeft className="me-2" /> Back to Home
                    </Link>

                    {/* Hero Title - Reduced Size */}
                    <div className="hero-text-content">
                      <div className="d-flex align-items-center mb-2">
                        <FaFire className="me-2 text-warning" size={24} />
                        <span className="badge bg-warning text-dark px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          LIMITED TIME
                        </span>
                      </div>
                      
                      <h1 className="display-5 fw-bold mb-2" style={{ 
                        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                        lineHeight: '1.1',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        FLASH SALE
                      </h1>
                      
                      <h2 className="h4 mb-2" style={{ 
                        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                        fontWeight: '400',
                        opacity: '0.9'
                      }}>
                        Up to 70% OFF Premium Items
                      </h2>
                      
                      <p className="lead mb-0" style={{ 
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        opacity: '0.8',
                        maxWidth: '500px'
                      }}>
                        Exclusive deals on suits, accessories, and more. Don't miss out!
                      </p>
                    </div>
                  </div>
                </Col>
                
                <Col lg={4} md={12} className="text-center text-lg-end">
                  <div className="countdown-section">
                    <div 
                      className="sale-countdown d-inline-flex flex-column align-items-center justify-content-center p-3"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(15px)',
                        borderRadius: '15px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        minWidth: '180px'
                      }}
                    >
                      <FaClock className="mb-2" size={24} />
                      <div className="countdown-text mb-1" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Sale Ends In
                      </div>
                      <div className="countdown-time" style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div className="countdown-labels mt-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        HOURS : MINUTES : SECONDS
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Container>
          </div>
        </Container>
      </section>

      {/* Sale Products Section - Hugo Boss Style */}
      <section className="featured-products-hugo sale-products-section">
        <Container fluid className="px-0">
          {/* Hugo Section Header */}
          <div className='hugo-section-header'>
            <Container>
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="hugo-title-block">
                    <span className="hugo-subtitle">FLASH SALE COLLECTION</span>
                    <h2 className="hugo-main-title">Premium Sale Items</h2>
                    <p className="hugo-description">
                      Exceptional deals on our finest collection. Limited time offers on premium suits, 
                      shoes, and accessories that define modern elegance.
                    </p>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <div className="hugo-controls">
                    <div className="hugo-filter-bar mb-3">
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        {/* Search */}
                        <div className="position-relative" style={{ minWidth: '200px' }}>
                          <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '14px' }} />
                          <Form.Control
                            type="text"
                            placeholder="Search sale items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ps-5 hugo-search-input"
                            style={{ 
                              borderRadius: '25px', 
                              fontSize: '14px',
                              height: '40px',
                              border: '1px solid #e9ecef'
                            }}
                          />
                        </div>
                        
                        {/* Category Filter */}
                        <Form.Select
                          value={selectedCategories[0] || ''}
                          onChange={(e) => setSelectedCategories(e.target.value ? [e.target.value] : [])}
                          className="hugo-filter-select"
                          style={{ 
                            borderRadius: '10px',
                            fontSize: '14px',
                            height: '40px',
                            minWidth: '150px'
                          }}
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Form.Select>
                        
                        {/* Sort */}
                        <Form.Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="hugo-sort-select"
                          style={{ 
                            borderRadius: '10px',
                            fontSize: '14px',
                            height: '40px',
                            minWidth: '180px'
                          }}
                        >
                          <option value="discount">🔥 Biggest Discount</option>
                          <option value="priceAsc">💰 Price: Low to High</option>
                          <option value="priceDesc">💎 Price: High to Low</option>
                          <option value="newest">✨ Newest First</option>
                          <option value="popular">⭐ Most Popular</option>
                        </Form.Select>
                      </div>
                    </div>
                    
                    <div className="hugo-product-count">
                      {filteredProducts.length} sale items available
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </div>

          {/* Hugo Products Container */}
          <Container className="hugo-products-container">
            {isLoading ? (
              <div className="hugo-loader text-center py-5">
                <Spinner animation="border" variant="danger" size="lg" />
                <p className="mt-3">Loading sale items...</p>
              </div>
            ) : error ? (
              <div className="hugo-error text-center py-5">
                <Alert variant="danger">
                  {error?.data?.message || error.error}
                </Alert>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="hugo-no-results text-center py-5">
                <Alert variant="info">
                  No sale items found matching your criteria. Try adjusting your filters.
                </Alert>
              </div>
            ) : (
              <>
                {/* Hugo Products Grid - Four Column Layout like Suits Screen */}
                <div className="hugo-products-grid-four">
                  {filteredProducts.map((product, index) => (
                    <div 
                      key={product._id} 
                      className="hugo-product-item sale-item"
                      style={{ '--delay': `${index * 0.1}s` }}
                    >
                      <div className="hugo-product-card">
                        <div className="hugo-product-image-container">
                          <Link to={`/product/${product._id}`} state={{ from: `/sale` }} className="hugo-product-link">
                            <div className="hugo-image-wrapper">
                              <img
                                src={getFullImageUrl(product.image)}
                                alt={product.name}
                                className="hugo-product-image"
                                loading="lazy"
                              />
                              <div className="hugo-image-overlay">
                                <span className="hugo-view-text">View Sale Item</span>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Sale Discount Badge - Hugo Style */}
                          <div className="hugo-discount-badge">
                            <FaTag className="me-1" />
                            {calculateDiscount(product)}% OFF
                          </div>

                          {/* Product Actions - Hugo Style */}
                          <div className="hugo-product-actions">
                            <button
                              className="hugo-action-btn hugo-wishlist-btn"
                              onClick={() => toggleWishlist(product)}
                              title="Add to Wishlist"
                            >
                              {wishlistItems.some(item => item._id === product._id) ? (
                                <FaHeart className="text-danger" />
                              ) : (
                                <FaRegHeart />
                              )}
                            </button>
                            <button
                              className="hugo-action-btn"
                              onClick={() => handleQuickView(product)}
                              title="Quick View"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </div>

                        <div className="hugo-product-info">
                          <div className="hugo-product-category">
                            <span>{product.category}</span>
                            <Badge bg="danger" className="ms-2 fw-bold sale-badge-prominent">
                              🔥 ON SALE
                            </Badge>
                          </div>
                          
                          <Link to={`/product/${product._id}`} state={{ from: `/sale` }} className="hugo-product-title-link">
                            <h3 className="hugo-product-title">{product.name}</h3>
                          </Link>

                          <div className="hugo-product-rating">
                            <div className="rating-stars">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < Math.floor(product.rating || 4.5) ? 'text-warning' : 'text-muted'}
                                />
                              ))}
                            </div>
                            <span className="hugo-rating-count">({product.numReviews || 0})</span>
                          </div>

                          <div className="hugo-product-pricing">
                            {(() => {
                              const priceInfo = getPriceDisplayInfo(product);
                              return (
                                <>
                                  <span className="hugo-current-price fw-bold text-danger">
                                    {formatPrice(priceInfo.currentPrice)}
                                  </span>
                                  {priceInfo.isOnSale && priceInfo.originalPrice > priceInfo.currentPrice && (
                                    <span className="hugo-original-price text-decoration-line-through text-muted ms-2">
                                      {formatPrice(priceInfo.originalPrice)}
                                    </span>
                                  )}
                                  {priceInfo.savings > 0 && (
                                    <div className="hugo-savings-amount text-success mt-1 fw-bold">
                                      <small>
                                        Save {formatPrice(priceInfo.savings)}
                                      </small>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          <div className="hugo-product-availability">
                            {product.countInStock > 0 ? (
                              <span className="hugo-in-stock">
                                {product.countInStock < 10 ? `Only ${product.countInStock} left!` : 'In Stock'}
                              </span>
                            ) : (
                              <span className="hugo-out-of-stock">Sold Out</span>
                            )}
                          </div>

                          <button
                            className="hugo-add-to-cart-btn"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.countInStock === 0}
                          >
                            <FaShoppingCart className="hugo-btn-icon" />
                            {product.countInStock === 0 ? 'Sold Out' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hugo View All Section */}
                <div className="hugo-view-all-section">
                  <Container>
                    <div className='hugo-view-all-content'>
                      <div className="hugo-view-all-text">
                        <h3>Don't Miss Out on These Amazing Deals</h3>
                        <p>Shop our complete collection for more incredible savings</p>
                      </div>
                      <button
                        className='hugo-view-all-btn'
                        onClick={() => navigate('/category/suits')}
                      >
                        <span>Browse All Products</span>
                        <FaArrowRight className="hugo-arrow-icon" />
                      </button>
                    </div>
                  </Container>
                </div>
              </>
            )}
          </Container>
        </Container>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        show={showQuickView}
        onHide={closeQuickView}
        product={quickViewProduct}
        onAddToCart={handleAddToCart}
        onToggleWishlist={toggleWishlist}
      />
    </>
  );
};

export default SaleScreen; 