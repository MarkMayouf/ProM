import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Container,
  Card,
  Button,
  Form,
  InputGroup,
  Toast,
  Badge,
  Carousel,
  Modal,
  Image,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaFilter,
  FaSortAmountDown,
  FaHeart,
  FaShoppingCart,
  FaArrowUp,
  FaArrowRight,
  FaPercent,
  FaTags,
  FaTag,
  FaComments,
  FaStar,
  FaStarHalfAlt,
  FaArrowLeft,
  FaEye,
  FaRegHeart,
  FaTimes,
  FaMinus,
  FaPlus,
  FaRobot,
  FaRuler,
  FaRegClock,
  FaCheck,
  FaCreditCard,
} from 'react-icons/fa';
import Product from '../components/Product';
import UniversalProductCard from '../components/UniversalProductCard';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import Meta from '../components/Meta';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useGetHomeContentQuery } from '../slices/homeContentApiSlice';
import { addToCart } from '../slices/cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import SizeRecommenderChatbot from '../components/SizeRecommenderChatbot';
import UserInfoChatbot from '../components/UserInfoChatbot';
import '../assets/styles/home.css';
import '../assets/styles/quickview.css';
import '../assets/styles/combinations.css';
import '../assets/styles/moores-style.css';
import '../assets/styles/suit-customizer.css';
import { toast } from 'react-toastify';
import QuickViewModal from '../components/QuickViewModal';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { getFullImageUrl } from '../utils/imageUtils';

// Handle WebSocket errors for development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('WebSocket connection')) {
      // Prevent the error from showing in console
      event.preventDefault();
    }
  });
}

const HomeScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageNumber = 1, keyword } = useParams();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // Debug logging for search functionality
  useEffect(() => {
    console.log('HomeScreen - Current keyword:', keyword);
    console.log('HomeScreen - Current pageNumber:', pageNumber);
  }, [keyword, pageNumber]);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const urlCategory = queryParams.get('category');
  const urlSubcategory = queryParams.get('subcategory');

  // State for active filters
  const [activeCategory, setActiveCategory] = useState(
    urlCategory && !['null', 'undefined'].includes(urlCategory) ? urlCategory : ''
  );
  const [activeSubcategory, setActiveSubcategory] = useState(
    urlSubcategory && !['null', 'undefined'].includes(urlSubcategory) ? urlSubcategory : ''
  );

  // Fetch products with filters
  const apiQueryParams = {
    keyword: keyword || '',
    pageNumber,
    category: activeCategory || undefined,
    subcategory: activeSubcategory || undefined,
  };

  // Debug logging for API query
  useEffect(() => {
    console.log('API Query Parameters:', apiQueryParams);
  }, [keyword, pageNumber, activeCategory, activeSubcategory]);

  const { data, isLoading, error } = useGetProductsQuery(apiQueryParams, {
    refetchOnMountOrArgChange: true
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (activeSubcategory) params.set('subcategory', activeSubcategory);

    const newSearch = params.toString();
    if (location.search !== `?${newSearch}`) {
      navigate({
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : '',
      }, { replace: true });
    }
  }, [activeCategory, activeSubcategory, location.pathname, navigate]);

  // Handle category change
  const handleCategoryChange = (category) => {
    if (!category) return;

    setActiveCategory(category);
    setActiveSubcategory(''); // Reset subcategory when category changes

    // Convert to lowercase for URL
    const urlCategory = category.toLowerCase();
    navigate({
      pathname: `/category/${urlCategory}`,
      search: ''
    });
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategory) => {
    if (!subcategory) return;

    setActiveSubcategory(subcategory);

    // Convert to lowercase for URL
    const urlCategory = activeCategory.toLowerCase();
    navigate({
      pathname: `/category/${urlCategory}`,
      search: `?subcategory=${subcategory}`
    });
  };

  // State variables
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showUserInfoChatbot, setShowUserInfoChatbot] = useState(false);
  const [visibleSection, setVisibleSection] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [showQuickView, setShowQuickView] = useState(false);
  const [animatedElements, setAnimatedElements] = useState({});
  
  // Perfect Combinations modal state
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [selectedCombination, setSelectedCombination] = useState(null);

  // Size recommendation modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeRecommendation, setSizeRecommendation] = useState('');

  // Fetch home content
  const {
    data: homeContent,
    isLoading: homeContentLoading,
    error: homeContentError,
  } = useGetHomeContentQuery();

  const handleAddToCart = (product, qty = 1) => {
    if (product.countInStock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      countInStock: product.countInStock,
      category: product.category,
      qty: qty
    }));
    
    toast.success(`${product.name} added to cart`);
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setShowQuickView(true);
    setQuickViewQty(1);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setQuickViewProduct(null);
    setQuickViewQty(1);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSizeRecommendation = (recommendation) => {
    setSizeRecommendation(recommendation);
    setShowSizeModal(true);
  };

  const handleUserInfoChatbotOpen = () => {
    setShowUserInfoChatbot(true);
  };

  const handleUserInfoChatbotClose = () => {
    setShowUserInfoChatbot(false);
  };

  const handleChatbotRecommendations = (recommendations) => {
    // Handle chatbot recommendations
    console.log('Chatbot recommendations:', recommendations);
  };

  return (
    <>
      <Meta />
      
      {/* Search Results */}
      {keyword && (
        <Container className="my-5">
          <Row>
            <Col>
              <h2 className="mb-4">Search Results for "{keyword}"</h2>
              {isLoading ? (
                <Loader />
              ) : error ? (
                <Message variant="danger">
                  {error?.data?.message || error.error}
                </Message>
              ) : (
                <>
                  {data?.products?.length === 0 ? (
                    <Message>No products found matching "{keyword}"</Message>
                  ) : (
                    <>
                      <p className="text-muted mb-4">
                        Found {data?.total || 0} products
                      </p>
                      <div className="hugo-products-grid">
                        {data?.products?.map((product) => (
                          <div key={product._id} className="hugo-product-item">
                            <div className="hugo-product-card">
                              <div className="hugo-product-image-container">
                                <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                                      src={getFullImageUrl(product.image)}
                                      alt={product.name}
                                      className="hugo-product-image"
                                      onError={(e) => {
                                        e.target.src = '/images/placeholder.jpg';
                                      }}
                                    />
                                  </div>
                                </Link>
                                
                                {product.salePrice && product.salePrice < product.price && (
                                  <div className="hugo-discount-badge">
                                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                                <div className="hugo-product-actions">
                                  <button
                                    className="hugo-action-btn hugo-wishlist-btn"
                                    onClick={() => {
                                      dispatch(toggleWishlistItem({
                                        _id: product._id,
                                        name: product.name,
                                        image: product.image,
                                        price: product.price,
                                        brand: product.brand,
                                        category: product.category
                                      }));
                                      toast.success('Added to wishlist');
                                    }}
                                    title="Add to Wishlist"
                                  >
                                    <FaHeart />
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
                                </div>
                                
                                <Link to={`/product/${product._id}`} className="hugo-product-title-link">
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
                                  {product.salePrice && product.salePrice < product.price ? (
                                    <>
                                      <span className="hugo-current-price">${product.salePrice}</span>
                                      <span className="hugo-original-price">${product.price}</span>
                                    </>
                                  ) : (
                                    <span className="hugo-current-price">${product.price}</span>
                                  )}
                                </div>

                                <div className="hugo-product-availability">
                                  {product.countInStock > 0 ? (
                                    <span className="hugo-in-stock">In Stock</span>
                                  ) : (
                                    <span className="hugo-out-of-stock">Out of Stock</span>
                                  )}
                                </div>

                                <button
                                  className="hugo-add-to-cart-btn"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.countInStock === 0}
                                >
                                  <FaShoppingCart className="hugo-btn-icon" />
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      )}

      {/* Home Page Content - Only show when not searching */}
      {!keyword && (
        <>
          {/* Flash Sale Banner */}
          <section className="flash-sale-banner">
            <Container>
              <div className="flash-sale-container">
                <div className="flash-sale-content d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="flash-icon me-3">
                      ⚡
                    </div>
                    <div>
                      <h3 className="flash-title mb-1">Flash Sale!</h3>
                      <p className="flash-label mb-0">Up to 50% off selected items</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="flash-sale-timer me-3">
                      <span>Ends in: 23:59:45</span>
                    </div>
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => navigate('/sale')}
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Hero Section */}
          <section className="hero-section">
            <Carousel fade className="hero-slider" controls={true} indicators={true} interval={5000}>
              <Carousel.Item>
                <div 
                  className="hero-slide hero-slide-bg" 
                  style={{
                    backgroundImage: `url('/images/hero-main-banner.jpg')`
                  }}
                >
                  <div className="hero-gradient-overlay"></div>
                  <Container className="hero-content">
                    <Row className="align-items-center min-vh-75">
                      <Col lg={6}>
                        <div className="hero-text-content">
                          <Badge className="hero-badge mb-3">New Arrivals</Badge>
                          <h1 className="hero-title display-2 mb-4">
                            Refined Elegance For Every Occasion
                          </h1>
                          <p className="hero-description lead mb-4">
                            Explore our new collection of premium suits designed for the modern gentleman.
                          </p>
                          <Button 
                            className="hero-btn me-3"
                            size="lg"
                            onClick={() => navigate('/sale')}
                          >
                            Shop Collection
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </div>
              </Carousel.Item>
              
              <Carousel.Item>
                <div 
                  className="hero-slide hero-slide-bg" 
                  style={{
                    backgroundImage: `url('/images/hero-1.jpg')`
                  }}
                >
                  <div className="hero-gradient-overlay"></div>
                  <Container className="hero-content">
                    <Row className="align-items-center min-vh-75">
                      <Col lg={6}>
                        <div className="hero-text-content">
                          <Badge className="hero-badge mb-3">Limited Time</Badge>
                          <h1 className="hero-title display-2 mb-4">
                            Summer Sale Up To 50% Off
                          </h1>
                          <p className="hero-description lead mb-4">
                            Limited time offers on select styles and accessories. Shop now before they're gone.
                          </p>
                          <Button 
                            className="hero-btn me-3"
                            size="lg"
                            onClick={() => navigate('/sale')}
                          >
                            Shop Sale
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </div>
              </Carousel.Item>
            </Carousel>
          </section>

          {/* Category Showcase */}
          <section className="category-showcase py-5">
            <Container>
              <div className="section-title text-center mb-5">
                <h2 className="display-4 mb-3">Shop by Category</h2>
                <p className="lead text-muted">Discover our premium collections</p>
              </div>
              
              <Row className="g-4">
                <Col lg={4} md={6}>
                  <Card className="category-card h-100 border-0 shadow-sm">
                    <div className="category-image-wrapper">
                      <Card.Img 
                        variant="top" 
                        src="/images/category-suits-hero.jpg"
                        className="category-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                    <Card.Body className="text-center p-4">
                      <Card.Title className="h3 mb-3">Suits</Card.Title>
                      <Card.Text className="category-description text-muted mb-4">
                        Premium suits for every occasion, tailored to perfection.
                      </Card.Text>
                      <Button 
                        className="category-btn"
                        onClick={() => handleCategoryChange('Suits')}
                      >
                        Explore Suits
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={4} md={6}>
                  <Card className="category-card h-100 border-0 shadow-sm">
                    <div className="category-image-wrapper">
                      <Card.Img 
                        variant="top" 
                        src="/images/category-shoes-hero.jpg"
                        className="category-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                    <Card.Body className="text-center p-4">
                      <Card.Title className="h3 mb-3">Shoes</Card.Title>
                      <Card.Text className="category-description text-muted mb-4">
                        Elevate your style with our exclusive footwear collection.
                      </Card.Text>
                      <Button 
                        className="category-btn"
                        onClick={() => handleCategoryChange('Shoes')}
                      >
                        Explore Shoes
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={4} md={6}>
                  <Card className="category-card h-100 border-0 shadow-sm">
                    <div className="category-image-wrapper">
                      <Card.Img 
                        variant="top" 
                        src="/images/category-accessories-hero.jpg"
                        className="category-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                    <Card.Body className="text-center p-4">
                      <Card.Title className="h3 mb-3">Accessories</Card.Title>
                      <Card.Text className="category-description text-muted mb-4">
                        Complete your look with our premium accessories collection.
                      </Card.Text>
                      <Button 
                        className="category-btn"
                        onClick={() => handleCategoryChange('Accessories')}
                      >
                        Explore Accessories
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Featured Products */}
          {!isLoading && data?.products && (
            <section className="featured-products-hugo py-5">
              <Container>
                <div className="hugo-section-header text-center mb-5">
                  <div className="hugo-title-block">
                    <p className="hugo-subtitle">Discover Excellence</p>
                    <h2 className="hugo-main-title">Featured Products</h2>
                    <p className="hugo-description">
                      Handpicked selections from our premium collection
                    </p>
                  </div>
                </div>

                <div className="hugo-products-container">
                  <div className="hugo-products-grid">
                    {data.products.slice(0, 8).map((product) => (
                      <div key={product._id} className="hugo-product-item">
                        <div className="hugo-product-card">
                          <div className="hugo-product-image-container">
                            <Link to={`/product/${product._id}`} className="hugo-product-link">
                              <div className="hugo-image-wrapper">
                                <img
                                  src={getFullImageUrl(product.image)}
                                  alt={product.name}
                                  className="hugo-product-image"
                                  onError={(e) => {
                                    e.target.src = '/images/placeholder.jpg';
                                  }}
                                />
                              </div>
                            </Link>
                            
                            {product.salePrice && product.salePrice < product.price && (
                              <div className="hugo-discount-badge">
                                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                              </div>
                            )}

                            <div className="hugo-product-actions">
                              <button
                                className="hugo-action-btn hugo-wishlist-btn"
                                onClick={() => {
                                  dispatch(toggleWishlistItem({
                                    _id: product._id,
                                    name: product.name,
                                    image: product.image,
                                    price: product.price,
                                    brand: product.brand,
                                    category: product.category
                                  }));
                                  toast.success('Added to wishlist');
                                }}
                                title="Add to Wishlist"
                              >
                                <FaHeart />
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
                            </div>
                            
                            <Link to={`/product/${product._id}`} className="hugo-product-title-link">
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
                              {product.salePrice && product.salePrice < product.price ? (
                                <>
                                  <span className="hugo-current-price">${product.salePrice}</span>
                                  <span className="hugo-original-price">${product.price}</span>
                                </>
                              ) : (
                                <span className="hugo-current-price">${product.price}</span>
                              )}
                            </div>

                            <div className="hugo-product-availability">
                              {product.countInStock > 0 ? (
                                <span className="hugo-in-stock">In Stock</span>
                              ) : (
                                <span className="hugo-out-of-stock">Out of Stock</span>
                              )}
                            </div>

                            <button
                              className="hugo-add-to-cart-btn"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.countInStock === 0}
                            >
                              <FaShoppingCart className="hugo-btn-icon" />
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Container>
            </section>
          )}
        </>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        show={showQuickView}
        onHide={closeQuickView}
        product={quickViewProduct}
        qty={quickViewQty}
        onQtyChange={setQuickViewQty}
        onAddToCart={() => {
          if (quickViewProduct) {
            handleAddToCart(quickViewProduct, quickViewQty);
            closeQuickView();
          }
        }}
        onToggleWishlist={() => {
          if (quickViewProduct) {
            dispatch(toggleWishlistItem({
              _id: quickViewProduct._id,
              name: quickViewProduct.name,
              image: quickViewProduct.image,
              price: quickViewProduct.price,
              brand: quickViewProduct.brand,
              category: quickViewProduct.category
            }));
            toast.success('Added to wishlist');
          }
        }}
        isInWishlist={quickViewProduct && wishlistItems.some(item => item._id === quickViewProduct._id)}
      />

      {/* Size Recommendation Modal */}
      <Modal show={showSizeModal} onHide={() => setShowSizeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Size Recommendation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Based on your profile, we recommend:</p>
          <h5>Size: {sizeRecommendation}</h5>
          <p className="text-muted">This recommendation is based on your measurements and fit preferences.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSizeModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleSizeRecommendation(sizeRecommendation)}>
            Apply Size
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Chatbot Components */}
      <UserInfoChatbot
        isOpen={showUserInfoChatbot}
        onClose={handleUserInfoChatbotClose}
        onRecommendations={handleChatbotRecommendations}
      />

      {/* Scroll to Top Button */}
      <Button
        className="scroll-to-top"
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--primary-color)',
          borderColor: 'var(--primary-color)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <FaArrowUp />
      </Button>
    </>
  );
};

export default HomeScreen;
                        