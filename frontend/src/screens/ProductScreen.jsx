import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
  Container,
  Modal,
  Alert,
  Tabs,
  Tab,
  Nav,
  Badge,
  ProgressBar,
  Accordion,
  Tooltip,
  OverlayTrigger,
  Breadcrumb,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { getFullImageUrl, handleImageError } from '../utils/imageUtils';
import {
  useGetProductDetailsQuery,
  useCreateReviewMutation,
  useGetProductsQuery,
} from '../slices/productsApiSlice';
import {
  FaStar,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaShare,
  FaRuler,
  FaTruck,
  FaExchangeAlt,
  FaInfoCircle,
  FaCheck,
  FaMinus,
  FaPlus,
  FaRegClock,
  FaArrowLeft,
  FaRobot,
  FaExclamationTriangle,
  FaCreditCard,
  FaComment,
  FaShippingFast,
  FaShieldAlt,
  FaTimes,
} from 'react-icons/fa';
import {
  Rating,
  Loader,
  Message,
  Meta,
  CustomizationChatbot,
  BreadcrumbNav,
  SuitCustomizationChart,
  ProductImageGallery,
} from '../components';
import CustomizationModal from '../components/CustomizationModal';
import SizeChart from '../components/SizeChart';
import { addToCart, updateCartItemCustomizations } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import SuitCustomizer from '../components/SuitCustomizer';
import CustomizationGuide from '../components/CustomizationGuide';
import SizeRecommenderChatbot from '../components/SizeRecommenderChatbot';
import '../assets/styles/customization.css';
import '../assets/styles/product.css';
import '../assets/styles/product-gallery.css';
import { Helmet } from 'react-helmet-async';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { prepareProductForCart, getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// Add error handling for WebSocket connections
const handleWebSocketError = () => {
  console.error('WebSocket connection failed. This may affect live updates and hot reloading.');
  // This only affects development environment hot reloading, not functionality
};

// If running in browser environment, add global error handler for WebSockets
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('WebSocket connection')) {
      handleWebSocketError();
      // Prevent the error from showing in console
      event.preventDefault();
    }
  });
}

const ProductScreen = () => {
  const { id: productId } = useParams();
  const location = useLocation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reviewsRef = useRef(null);
  const addToCartRef = useRef(null);

  // Scroll to top when component mounts or product changes
  useScrollToTop({ onMount: true });

  // Add calculateTailoringCost function
  const calculateTailoringCost = () => {
    if (!customizations || !customizations.measurements || !customizations.preferences) {
      return 0;
    }

    const baseTailoringCost = 100; // Base cost for tailoring
    let totalCost = baseTailoringCost;

    // Add cost based on preferences
    const { preferences } = customizations;
    
    // Occasion multiplier
    const occasionMultipliers = {
      'Wedding': 1.2,
      'Business': 1.1,
      'Casual': 1.0,
      'Other': 1.0
    };
    const occasionMultiplier = occasionMultipliers[preferences.occasion] || 1.0;

    // Fit multiplier
    const fitMultipliers = {
      'Slim': 1.1,
      'Regular': 1.0,
      'Relaxed': 1.0
    };
    const fitMultiplier = fitMultipliers[preferences.fit] || 1.0;

    // Style complexity multiplier
    const styleMultipliers = {
      'Classic': 1.0,
      'Modern': 1.1,
      'Custom': 1.2
    };
    const styleMultiplier = styleMultipliers[preferences.style] || 1.0;

    // Apply multipliers
    totalCost *= occasionMultiplier * fitMultiplier * styleMultiplier;

    // Add cost for each measurement adjustment
    const { measurements } = customizations;
    const measurementCount = Object.keys(measurements).filter(key => measurements[key]).length;
    totalCost += measurementCount * 15; // $15 per measurement adjustment

    // Add cost for special requirements
    if (customizations.specialRequirements) {
      totalCost += 50; // Additional cost for special requirements
    }

    // Round to 2 decimal places
    return Math.round(totalCost * 100) / 100;
  };

  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizations, setCustomizations] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [highlightRecommended, setHighlightRecommended] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState({
    id: 'navy',
    name: 'Navy Blue',
    hex: '#1a2c42',
  });
  const [showCustomizationChatbot, setShowCustomizationChatbot] =
    useState(false);
  const [customizerError, setCustomizerError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [tailoringCost, setTailoringCost] = useState(0);
  const [showTailoringWarning, setShowTailoringWarning] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [productCustomizations, setProductCustomizations] = useState(null);
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Add validation for productId
  useEffect(() => {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      toast.error('Invalid product ID');
      navigate('/');
      return;
    }
  }, [productId, navigate]);

  // Enhance error handling for product data fetching
  const {
    data: product,
    isLoading,
    error: productError,
    refetch
  } = useGetProductDetailsQuery(productId);

  // Add error boundary for product data
  useEffect(() => {
    if (productError) {
      const errorMessage = productError?.data?.message || 'Error loading product details';
      toast.error(errorMessage);
      if (productError.status === 404) {
        navigate('/');
      }
    }
  }, [productError, navigate]);

  // Get related products based on category
  const { data: productsData } = useGetProductsQuery({
    pageSize: 4,
    category: product?.category,
  });

  const relatedProducts =
    productsData?.products?.filter((p) => p._id !== productId).slice(0, 4) ||
    [];

  const { userInfo } = useSelector((state) => state.auth);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const isInWishlist = wishlistItems.some(item => item._id === productId);

  const [createReview, { isLoading: loadingProductReview }] =
    useCreateReviewMutation();

  // Get query parameters for breadcrumb navigation
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  const subcategoryParam = queryParams.get('subcategory');
  const customizeParam = queryParams.get('customize');
  const cartItemId = queryParams.get('cartItemId');
  const sizeParam = queryParams.get('size');

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  // Find cart item if editing from cart
  const cartItem = cartItemId
    ? cartItems.find((item) => item._id === productId)
    : null;
  const isEditingCartItem = Boolean(cartItem && customizeParam === 'true');

  // Track scroll for sticky add to cart
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        setStickyVisible(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set selected size from URL parameter when editing from cart
  useEffect(() => {
    if (sizeParam && customizeParam === 'true') {
      setSelectedSize(sizeParam);
    }
  }, [sizeParam, customizeParam]);

  // Open customizer automatically if customize=true in URL
  useEffect(() => {
    if (customizeParam === 'true' && product?.category === 'Suits') {
      // If editing from cart, show the customization modal instead of the customizer
      if (cartItem && cartItem.customizations) {
        setProductCustomizations(cartItem.customizations);
        setShowCustomizationModal(true);
      } else {
        setShowCustomizer(true);
        setActiveTab('customize');
      }

      // If editing from cart, set the existing customizations
      if (cartItem && cartItem.customizations) {
        setCustomizations(cartItem.customizations);
      }

      // Scroll to top for better modal visibility
      setTimeout(() => {
        // Removed automatic scroll to prevent page jumping
      // window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [customizeParam, product, cartItem]);

  // Update image URL when product data is loaded
  useEffect(() => {
    if (product && product.image) {
      const fullImageUrl = getFullImageUrl(product.image);
      console.log('Full image URL:', fullImageUrl); // Debug log
    }
  }, [product]);

  // Enhanced customization validation
  const handleCustomizationComplete = (customizationData) => {
    try {
      if (!customizationData) {
        throw new Error('Invalid customization data');
      }

      // Validate measurements
      const { measurements } = customizationData;
      const requiredMeasurements = ['chest', 'waist', 'shoulder', 'sleeve'];
      const missingMeasurements = requiredMeasurements.filter(m => !measurements[m]);

      if (missingMeasurements.length > 0) {
        throw new Error(`Missing measurements: ${missingMeasurements.join(', ')}`);
      }

      // Validate preferences
      const { preferences } = customizationData;
      if (!preferences.fit || !preferences.style || !preferences.occasion) {
        throw new Error('Please complete all customization preferences');
      }

      setCustomizations(customizationData);
      setShowCustomizationChatbot(false);
      setTailoringCost(calculateTailoringCost());
      toast.success('Customization saved successfully');
    } catch (error) {
      console.error('Customization error:', error);
      toast.error(error.message || 'Failed to save customization');
      setCustomizerError(error.message);
    }
  };

  // Enhanced add to cart validation
  const addToCartHandler = () => {
    try {
      if (!selectedSize && product.category !== 'Accessories') {
        toast.error('Please select a size');
        return;
      }

      if (qty <= 0) {
        toast.error('Please select a valid quantity');
        return;
      }

      // Check stock availability
      if (product.category !== 'Accessories') {
        const selectedSizeObj = product.sizes.find(s => s.size === selectedSize);
        if (!selectedSizeObj || selectedSizeObj.quantity < qty) {
          toast.error('Selected quantity not available in stock');
          return;
        }
      } else if (product.countInStock < qty) {
        toast.error('Selected quantity not available in stock');
        return;
      }

      // Prepare customizations - don't save null, save undefined instead
      const finalCustomizations = productCustomizations || customizations || undefined;
      const finalTailoringCost = productCustomizations ? productCustomizations.totalCost : (customizations ? calculateTailoringCost() : 0);

      console.log('Adding to cart with customizations:', {
        productCustomizations,
        customizations,
        finalCustomizations,
        finalTailoringCost
      });

      // Add to cart with customizations using standardized pricing
      const cartProduct = prepareProductForCart(product, {
        qty,
        selectedSize,
        customizations: finalCustomizations,
        tailoringCost: finalTailoringCost
      });
      
      dispatch(addToCart(cartProduct));
      
      toast.success('Added to cart', { autoClose: 2000 });
      navigate('/cart');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const buyNowHandler = () => {
    addToCartHandler();
    navigate('/cart');
  };

  const handleSizeRecommendation = (recommendation) => {
    setSelectedSize(recommendation.size);
    setShowChatbot(false);
    toast.success(`Size ${recommendation.size} recommended based on your measurements`);
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('reviews');
  };

  const toggleWishlist = () => {
    if (product) {
      dispatch(toggleWishlistItem({
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        brand: product.brand,
        category: product.category
      }));
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', { autoClose: 2000 });
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await createReview({
        productId,
        rating,
        comment,
      }).unwrap();
      refetch();
      toast.success('Review submitted');
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Calculate rating distribution
  const getRatingCounts = () => {
    if (!product?.reviews) return Array(5).fill(0);

    const counts = Array(5).fill(0);
    product.reviews.forEach((review) => {
      if (review.rating > 0 && review.rating <= 5) {
        counts[5 - review.rating]++;
      }
    });
    return counts;
  };

  // Fix image display
  const productImage = product?.image ? getFullImageUrl(product.image) : '/images/sample.jpg';

  // Product images array (main image + additional images from product.images)
  const productImages = product
    ? [
        productImage,
        ...(product.images || []).map(img => getFullImageUrl(img))
      ]
    : [];

  const carouselResponsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 5,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 4,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 3,
    },
  };

  const handleCustomizeClick = () => {
    if (!userInfo) {
      navigate('/login');
      toast.info('Please log in to customize this item');
      return;
    }
    
    // Show chatbot first for guidance
    setShowCustomizationChatbot(true);
    setActiveTab('customize');
  };

  const handleChatbotComplete = (chatbotData) => {
    setShowCustomizationChatbot(false);
    // Store chatbot recommendations
    setCustomizations(prev => ({
      ...prev,
      chatbotRecommendations: chatbotData
    }));
    // Now show the customizer with the chatbot's recommendations
    setShowCustomizer(true);
  };

  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  const toggleCustomizationChatbot = () => {
    if (product?.category === 'Shoes' || product?.category === 'Accessories') {
      toast.info('Customization is not available for shoes and accessories.');
      return;
    }
    
    setChatbotVisible(!chatbotVisible);
    setShowCustomizationChatbot(!showCustomizationChatbot);
  };

  // Add useEffect for animation
  useEffect(() => {
    if (showCustomizationChatbot) {
      setTimeout(() => {
        setChatbotVisible(true);
      }, 100);
    }
  }, [showCustomizationChatbot]);

  // Handle customization modal
  const openCustomizationModal = () => {
    // Safety check: prevent customization for shoes and accessories
    if (product?.category === 'Shoes' || product?.category === 'Accessories') {
      toast.info('Customization is not available for shoes and accessories.');
      return;
    }
    
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.warning('Please select a size before customizing your suit');
      return;
    }
    setShowCustomizationModal(true);
  };

  const closeCustomizationModal = () => {
    setShowCustomizationModal(false);
  };

  const handleCustomizationModalComplete = (customizationData) => {
    console.log('Customization Modal Complete - Data:', customizationData);
    setProductCustomizations(customizationData);
    setShowCustomizationModal(false);
    
    // If editing from cart, update the cart item and redirect back to cart
    if (isEditingCartItem && cartItem) {
      console.log('Updating existing cart item with customizations:', customizationData);
      // Update the cart with the new customizations using the correct action
      dispatch(updateCartItemCustomizations({
        id: cartItem._id,
        size: cartItem.selectedSize,
        customizations: customizationData,
        tailoringCost: customizationData.totalCost || 0
      }));
      
      toast.success('Customizations updated successfully!');
      navigate('/cart');
    } else {
      console.log('Setting product customizations for new item:', customizationData);
      toast.success('Customizations applied successfully!');
      
      // Show tailoring warning with cost
      setShowTailoringWarning(true);
      setTailoringCost(customizationData.totalCost);
    }
  };

  // Handle size chart modal
  const openSizeChartModal = () => {
    setShowSizeChartModal(true);
  };

  const closeSizeChartModal = () => {
    setShowSizeChartModal(false);
  };

  // Share functionality
  const handleShare = () => {
    setShowShareModal(true);
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const title = `Check out this ${product.name} from ProMayouf`;
    const description = product.description || `Premium ${product.category} - ${product.name}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(getFullImageUrl(product.image))}&description=${encodeURIComponent(description)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\nCheck it out: ${url}`)}`;
        break;
      default:
        return;
    }
    
    if (platform === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareModal(false);
    toast.success(`Shared to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
      setShowShareModal(false);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
      setShowShareModal(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ProMayouf`,
          text: product.description || `Check out this premium ${product.category}`,
          url: window.location.href,
        });
        setShowShareModal(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard(); // Fallback to copy
        }
      }
    } else {
      copyToClipboard(); // Fallback for browsers without native share
    }
  };

  // Helper function to check if a size is available
  const isSizeAvailable = (sizeValue) => {
    if (!product?.sizes) return false;
    const sizeObj = product.sizes.find((s) => s.size === sizeValue);
    return sizeObj && sizeObj.quantity > 0;
  };

  // Sticky Add to Cart
  const StickyAddToCart = () => {
    if (!stickyVisible || !product) return null;

    return (
      <div className='sticky-add-to-cart'>
        <Container>
          <Row className='align-items-center'>
            <Col xs={2} sm={1}>
              <Image src={product.image} alt={product.name} thumbnail />
            </Col>
            <Col xs={6} sm={3}>
              <h5 className='product-sticky-title'>{product.name}</h5>
              <div className='product-sticky-price'>
                ${product.price.toFixed(2)}
              </div>
            </Col>
            <Col xs={4} sm={2} className='d-none d-sm-block'>
              <Form.Select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className='form-select-sm me-2'
              >
                <option value=''>Size</option>
                {product.sizes?.map((size) => (
                  <option
                    key={size.size}
                    value={size.size}
                    disabled={size.quantity === 0}
                  >
                    {size.size} {size.quantity === 0 ? '(Out of Stock)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={4} sm={2} className='d-none d-sm-block'>
              <div className='d-flex align-items-center'>
                <div className='color-selector-sticky d-flex gap-2'>
                  {/* Only show active color in sticky header */}
                  <div
                    style={{
                      backgroundColor: selectedColor?.hex || '#1a2c42',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid #ddd',
                    }}
                  ></div>
                  <small className='text-truncate'>
                    {selectedColor?.name || 'Navy Blue'}
                  </small>
                </div>
              </div>
            </Col>
            <Col
              xs={12}
              sm={4}
              className='d-flex justify-content-end align-items-center gap-2'
            >
              {['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts'].includes(product?.category) && (
                <Button
                  type='button'
                  variant='outline-primary'
                  size='sm'
                  onClick={openCustomizationModal}
                  title='Customize this product'
                >
                  <FaRuler className='me-1' /> Customize
                </Button>
              )}
              <Button
                type='button'
                className='add-to-cart-btn'
                disabled={!selectedSize}
                onClick={addToCartHandler}
              >
                <FaShoppingCart className='me-2' /> Add to Cart
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Loading product details...</p>
        </div>
      </Container>
    );
  }

  if (productError) {
    return (
      <Container className="py-5">
        <div className="text-center error-container">
          <div className="error-icon mb-4">
            <FaInfoCircle size={50} className="text-danger" />
          </div>
          <h2>Product Not Found</h2>
          <p className="text-muted mb-4">
            {productError?.data?.message || 'The product you are looking for might have been removed or is temporarily unavailable.'}
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate(-1)}
              className="d-flex align-items-center"
            >
              <FaArrowLeft className="me-2" /> Go Back
            </Button>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="product-page-container">
      <Meta title={product?.name} description={product?.description} />
      <Helmet>
        <title>{product?.name} | ProMayouf</title>
        <meta name="description" content={product?.description} />
        <meta property="og:title" content={product?.name} />
        <meta property="og:description" content={product?.description} />
        <meta property="og:image" content={getFullImageUrl(product?.image)} />
      </Helmet>

      {/* Breadcrumb Section */}
      <section className="product-breadcrumb">
        <Container>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
              Home
            </Breadcrumb.Item>
            {product?.category && (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/category/${product.category.toLowerCase()}` }}>
                {product.category}
              </Breadcrumb.Item>
            )}
            {product?.subCategory && (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/category/${product.category.toLowerCase()}?subcategory=${product.subCategory}` }}>
                {product.subCategory}
              </Breadcrumb.Item>
            )}
            <Breadcrumb.Item active>{product?.name}</Breadcrumb.Item>
          </Breadcrumb>
        </Container>
      </section>

      {/* Product Main Content */}
      <section className="product-main-content">
        <Container>
          <Row>
            {/* Product Gallery - Enhanced with ProductImageGallery */}
            <Col lg={6} className="product-gallery-moores mb-4">
              <ProductImageGallery
                mainImage={product.image}
                images={product.images || []}
                productName={product.name}
                showThumbnails={true}
                maxThumbnails={6}
                className="product-detail-gallery"
              />
        </Col>

            {/* Product Info - Moores Style */}
            <Col lg={6} className="product-info-moores">
              {/* Brand */}
              <div className="product-brand-moores">
                {product.brand}
              </div>

              {/* Product Title */}
              <h1 className="product-title-moores">{product.name}</h1>

              {/* Rating */}
              <div className="product-rating-moores">
                <div className="stars">
                  <Rating value={product.rating} text="" />
            </div>
                <span className="rating-count">({product.numReviews} reviews)</span>
          </div>

              {/* Price */}
              <div className="product-price-moores">
                {(() => {
                  const priceInfo = getPriceDisplayInfo(product);
                  return (
                    <>
                      <span className="product-price-current-moores">
                        {formatPrice(priceInfo.currentPrice)}
                      </span>
                      {priceInfo.isOnSale && priceInfo.originalPrice > priceInfo.currentPrice && (
                        <>
                          <span className="product-price-original-moores">
                            {formatPrice(priceInfo.originalPrice)}
                          </span>
                          <span className="product-discount-badge-moores">
                            {priceInfo.discountPercentage}% OFF
                          </span>
                        </>
                      )}
                    </>
                  );
                })()}
                {tailoringCost > 0 && (
                  <div className="tailoring-cost mt-2">
                    <small className="text-muted">+ ${tailoringCost} tailoring</small>
                  </div>
                )}
              </div>

              {/* Product Options */}
              <div className="product-options-moores">
                {/* Size Selection */}
                {product.countInStock > 0 && product.sizes && product.sizes.length > 0 && (
                  <div className="product-option-group-moores">
                    <label className="product-option-label-moores">
                      Select Size
                    </label>
                    <div className="size-options-moores">
                {product.sizes.map((size) => (
                  <button
                    key={size.size}
                          className={`size-option-moores ${
                      selectedSize === size.size ? 'selected' : ''
                    } ${!isSizeAvailable(size.size) ? 'unavailable' : ''} ${
                      recommendedSize === size.size && highlightRecommended
                        ? 'recommended'
                        : ''
                    }`}
                    onClick={() => setSelectedSize(size.size)}
                    disabled={!isSizeAvailable(size.size)}
                  >
                    {size.size}
                  </button>
                ))}
              </div>
                    <a href="#" className="size-guide-link-moores" onClick={(e) => {
                      e.preventDefault();
                      setShowSizeGuide(true);
                    }}>
                      <FaInfoCircle /> Size Guide
                    </a>
            </div>
          )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="product-option-group-moores">
                    <label className="product-option-label-moores">
                      Color: {selectedColor.name}
                    </label>
                    <div className="color-options-moores">
                      {product.colors.map((color) => (
                        <div
                          key={color.id}
                          className={`color-option-moores ${
                            selectedColor.id === color.id ? 'selected' : ''
                          }`}
                          style={{ backgroundColor: color.hex }}
                          onClick={() => setSelectedColor(color)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="quantity-selector-moores">
                  <span className="quantity-label-moores">Quantity</span>
                  <div className="quantity-controls-moores">
                    <button
                      className="quantity-btn-moores"
                onClick={() => qty > 1 && setQty(qty - 1)}
                disabled={qty <= 1}
              >
                <FaMinus />
                    </button>
                    <input
                      type="number"
                      className="quantity-display-moores"
                      value={qty}
                      readOnly
                    />
                    <button
                      className="quantity-btn-moores"
                onClick={() => qty < product.countInStock && setQty(qty + 1)}
                disabled={qty >= product.countInStock}
              >
                <FaPlus />
                    </button>
            </div>
          </div>
              </div>

              {/* Action Buttons */}
              <div className="product-actions-moores">
                <button
                  className="add-to-cart-btn-moores"
              onClick={addToCartHandler}
                  disabled={product.countInStock === 0 || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                  ref={addToCartRef}
            >
                  <FaShoppingCart />
              {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>

                <button
                  className="buy-now-btn-moores"
              onClick={buyNowHandler}
                  disabled={product.countInStock === 0 || (product.sizes && product.sizes.length > 0 && !selectedSize)}
            >
                  <FaCreditCard />
              Buy Now
                </button>

                {/* Customization Button for eligible categories */}
                {['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts'].includes(product?.category) && (
                  <button
                    className="customize-btn-moores"
                    onClick={openCustomizationModal}
                  >
                    <FaRuler />
                    {productCustomizations ? 'Edit Customizations' : 'Customize Your Suit'}
                  </button>
                )}
                      </div>

              {/* Secondary Actions */}
              <div className="secondary-actions-moores">
                <button
                  className="secondary-btn-moores"
                  onClick={toggleWishlist}
                >
                  <FaHeart />
                  {wishlistItems.some(item => item._id === productId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
                <button
                  className="secondary-btn-moores"
                  onClick={handleShare}
                >
                  <FaShare />
                  Share
                </button>
              </div>

              {/* Product Features */}
              <div className="product-features-moores">
                <h4 className="product-features-title-moores">Product Features</h4>
                <ul className="product-features-list-moores">
                  <li>Premium quality materials</li>
                  <li>Expert craftsmanship</li>
                  <li>Perfect fit guarantee</li>
                  <li>Free alterations included</li>
                  <li>30-day return policy</li>
                </ul>
          </div>
        </Col>
      </Row>
        </Container>
      </section>

      {/* Product Tabs - Moores Style */}
      <section className="product-tabs-moores">
        <Container>
          <Nav variant="tabs" className="nav-tabs-moores">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'description'}
                onClick={() => setActiveTab('description')}
              >
                Description
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'specifications'}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'reviews'}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.numReviews})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'shipping'}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping & Returns
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="tab-content mt-4">
            {activeTab === 'description' && (
              <div>
                <h4>Product Description</h4>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h4>Specifications</h4>
                <table className="table">
                    <tbody>
                      <tr>
                      <td><strong>Brand</strong></td>
                        <td>{product.brand}</td>
                      </tr>
                      <tr>
                      <td><strong>Material</strong></td>
                      <td>{product.material || 'Premium Wool'}</td>
                      </tr>
                      <tr>
                      <td><strong>Fit</strong></td>
                      <td>{product.fit || 'Regular'}</td>
                      </tr>
                      <tr>
                      <td><strong>Style</strong></td>
                      <td>{product.style || 'Business'}</td>
                      </tr>
                      <tr>
                      <td><strong>Color</strong></td>
                      <td>{product.color || selectedColor.name}</td>
                      </tr>
                      {product.pieces && (
                        <tr>
                        <td><strong>Pieces</strong></td>
                          <td>{product.pieces}-Piece Suit</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            )}

            {activeTab === 'reviews' && (
              <div ref={reviewsRef}>
                <h4>Customer Reviews</h4>
                {product.reviews && product.reviews.length === 0 && (
                  <Message>No Reviews</Message>
                )}
                <ListGroup variant='flush'>
                  {product.reviews &&
                    product.reviews.map((review) => (
                      <ListGroup.Item key={review._id}>
                          <strong>{review.name}</strong>
                          <Rating value={review.rating} />
                        <p>{review.createdAt.substring(0, 10)}</p>
                        <p>{review.comment}</p>
                      </ListGroup.Item>
                    ))}
                </ListGroup>

                  {userInfo ? (
                  <Form onSubmit={submitHandler} className="mt-4">
                    <Form.Group className='my-2' controlId='rating'>
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as='select'
                        required
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                    <Form.Group className='my-2' controlId='comment'>
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                        rows='3'
                        required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      <Button
                        disabled={loadingProductReview}
                        type='submit'
                        variant='primary'
                      >
                      Submit Review
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to='/login'>sign in</Link> to write a review
                    </Message>
                  )}
                </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h4>Shipping & Returns</h4>
                <div className="row">
                  <div className="col-md-6">
                    <h5><FaTruck className="me-2" />Shipping Information</h5>
                    <ul>
                      <li>Free shipping on orders over $100</li>
                      <li>Standard delivery: 3-5 business days</li>
                      <li>Express delivery: 1-2 business days</li>
                      <li>International shipping available</li>
                    </ul>
              </div>
                  <div className="col-md-6">
                    <h5><FaExchangeAlt className="me-2" />Returns & Exchanges</h5>
                    <ul>
                      <li>30-day return policy</li>
                      <li>Free returns and exchanges</li>
                      <li>Items must be in original condition</li>
                      <li>Customized items are final sale</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <Row className='related-products mt-5'>
          <Col xs={12}>
            <h3>Related Products</h3>
            <Row>
              {relatedProducts.map((relatedProduct) => (
                <Col key={relatedProduct._id} sm={6} md={4} lg={3}>
                  <Card className='product-card'>
                    <Link to={`/product/${relatedProduct._id}`}>
                      <Card.Img src={relatedProduct.image} variant='top' />
                    </Link>
                    <Card.Body>
                      <Link to={`/product/${relatedProduct._id}`}>
                        <Card.Title as='div'>
                          <strong>{relatedProduct.name}</strong>
                        </Card.Title>
                      </Link>
                      <Card.Text as='div'>
                        <Rating
                          value={relatedProduct.rating}
                          text={`${relatedProduct.numReviews} reviews`}
                        />
                      </Card.Text>
                      <Card.Text as='h3'>${relatedProduct.price}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      <div className="mobile-fixed-add-to-cart">
        <div className="product-title">{product.name}</div>
        <div className="product-price">
          {product.isOnSale ? (
            <>
              <span className="sale-price">${product.salePrice}</span>
              <span className="original-price">${product.price}</span>
            </>
          ) : (
            <span>${product.price}</span>
          )}
        </div>
        <div className="btn-group">
          {['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts'].includes(product?.category) && (
            <Button
              className="btn-customize"
              type="button"
              variant="outline-secondary"
              onClick={openCustomizationModal}
            >
              <FaRuler className="me-1" /> Customize
            </Button>
          )}
          <Button
            className="btn-add-to-cart"
            type="button"
            disabled={product.countInStock === 0 || (!selectedSize && product.category !== 'Accessories' && product.sizes && product.sizes.length > 0)}
            onClick={addToCartHandler}
          >
            <FaShoppingCart className="me-1" /> Add to Cart
          </Button>
          <Button
            className="btn-buy-now"
            variant="success"
            type="button"
            disabled={product.countInStock === 0 || (!selectedSize && product.category !== 'Accessories' && product.sizes && product.sizes.length > 0)}
            onClick={buyNowHandler}
          >
            <FaCreditCard className="me-1" /> Buy Now
          </Button>
        </div>
      </div>

      {/* Size Recommender Chatbot */}
      {showChatbot && (
        <SizeRecommenderChatbot
          onRecommendationComplete={handleSizeRecommendation}
          productType={product.category}
          open={showChatbot}
          setOpen={setShowChatbot}
        />
      )}

      {/* Customization Modal */}
      {showCustomizationModal && (
        <CustomizationModal
          show={showCustomizationModal}
          onHide={closeCustomizationModal}
          product={product}
          onCustomizationComplete={handleCustomizationModalComplete}
          existingCustomizations={productCustomizations}
          isEditing={isEditingCartItem}
        />
      )}

      {/* Size Chart Modal */}
      <Modal show={showSizeChartModal} onHide={closeSizeChartModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaInfoCircle className="me-2" />
            Size Chart - {product?.category}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <SizeChart category={product?.category} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSizeChartModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Size Guide Modal */}
      <Modal show={showGuide} onHide={() => setShowGuide(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaInfoCircle className="me-2" />
            Measurement Guide
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <CustomizationGuide />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGuide(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaShare className="me-2" />
            Share this Product
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="share-product-info mb-4">
            <Row className="align-items-center">
              <Col xs={3}>
                <img 
                  src={getFullImageUrl(product?.image)} 
                  alt={product?.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '80px', objectFit: 'cover' }}
                />
              </Col>
              <Col xs={9}>
                <h6 className="mb-1">{product?.name}</h6>
                <p className="text-muted mb-0 small">{product?.category}</p>
                <div className="fw-bold text-primary">
                  {product?.isOnSale ? (
                    <>
                      <span>${product.salePrice}</span>
                      <span className="text-muted text-decoration-line-through ms-2">${product.price}</span>
                    </>
                  ) : (
                    <span>${product?.price}</span>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div className="share-options">
            <h6 className="mb-3">Share via:</h6>
            <Row className="g-3">
              <Col xs={6}>
                <Button
                  variant="outline-primary"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={() => shareToSocial('facebook')}
                >
                  <i className="fab fa-facebook-f me-2"></i>
                  Facebook
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  variant="outline-info"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={() => shareToSocial('twitter')}
                >
                  <i className="fab fa-twitter me-2"></i>
                  Twitter
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  variant="outline-danger"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={() => shareToSocial('pinterest')}
                >
                  <i className="fab fa-pinterest me-2"></i>
                  Pinterest
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  variant="outline-success"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={() => shareToSocial('whatsapp')}
                >
                  <i className="fab fa-whatsapp me-2"></i>
                  WhatsApp
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  variant="outline-secondary"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={() => shareToSocial('email')}
                >
                  <i className="fas fa-envelope me-2"></i>
                  Email
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  variant="outline-dark"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={copyToClipboard}
                >
                  <i className="fas fa-copy me-2"></i>
                  Copy Link
                </Button>
              </Col>
            </Row>

            {navigator.share && (
              <div className="mt-3">
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={nativeShare}
                >
                  <FaShare className="me-2" />
                  Share via Device
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
    </Container>
  );
};

export default ProductScreen;
