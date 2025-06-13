import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import '../assets/styles/anti-flicker.css';
import { toast } from 'react-toastify';
import QuickViewModal from '../components/QuickViewModal';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { getFullImageUrl, handleImageError } from '../utils/imageUtils';
import { useScrollToTop } from '../hooks/useScrollToTop';

// Handle WebSocket errors for development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('WebSocket connection')) {
      // Prevent the error from showing in console
      event.preventDefault();
    }
  });
}

// Add debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageNumber = 1, keyword } = useParams();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // Remove debug logging - keeping effect for potential future debugging needs
  // useEffect(() => {
  //   console.log('HomeScreen - Current keyword:', keyword);
  //   console.log('HomeScreen - Current pageNumber:', pageNumber);
  // }, [keyword, pageNumber]);

  // Get query parameters from URL
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlCategory = queryParams.get('category');
  const urlSubcategory = queryParams.get('subcategory');

  // State for active filters - use useMemo to prevent unnecessary re-renders
  const [activeCategory, setActiveCategory] = useState(
    urlCategory && !['null', 'undefined'].includes(urlCategory) ? urlCategory : ''
  );
  const [activeSubcategory, setActiveSubcategory] = useState(
    urlSubcategory && !['null', 'undefined'].includes(urlSubcategory) ? urlSubcategory : ''
  );

  // Debounce API query parameters to prevent too many API calls
  const debouncedKeyword = useDebounce(keyword, 300);
  const debouncedCategory = useDebounce(activeCategory, 200);
  const debouncedSubcategory = useDebounce(activeSubcategory, 200);

  // Fetch products with filters - use memoized parameters
  const apiQueryParams = useMemo(() => ({
    keyword: debouncedKeyword || '',
    pageNumber,
    category: debouncedCategory || undefined,
    subcategory: debouncedSubcategory || undefined,
    limit: 50, // Get more products for home screen to show all categories
  }), [debouncedKeyword, pageNumber, debouncedCategory, debouncedSubcategory]);

  // Remove debug logging for API query
  // useEffect(() => {
  //   console.log('API Query Parameters:', apiQueryParams);
  // }, [apiQueryParams]);

  const { data, isLoading, error } = useGetProductsQuery(apiQueryParams, {
    refetchOnMountOrArgChange: true,
    skip: false, // Ensure we don't skip the query
  });

  // Update URL when filters change - use useCallback to prevent re-creation
  const updateURL = useCallback((category, subcategory) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);

    const newSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    
    if (currentSearch !== newSearch) {
      navigate({
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : '',
      }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Update URL when filters change - debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL(activeCategory, activeSubcategory);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeCategory, activeSubcategory, updateURL]);

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

  // Featured categories - memoized to prevent re-creation on every render
  const categories = useMemo(() => [
    {
      id: 'Suits',
      name: 'Suits',
      image: '/images/1.jpg',
      description: 'Premium suits for every occasion, tailored to perfection.',
      link: 'suits', // Use lowercase for URL
      count: '150+ Items',
      subcategories: [
        { name: 'Business Suits', link: 'suits?subcategory=business' },
        { name: 'Wedding Suits', link: 'suits?subcategory=wedding' },
        { name: 'Formal Suits', link: 'suits?subcategory=formal' },
        { name: 'Casual Suits', link: 'suits?subcategory=casual' },
      ],
      featured: {
        title: 'Executive Collection',
        description: 'Premium suits for the modern professional.',
        link: 'suits?subcategory=business',
      },
    },
    {
      id: 'Shoes',
      name: 'Shoes',
      image: '/images/shoes.jpg',
      description: 'Elevate your style with our exclusive footwear collection.',
      link: 'shoes', // Use lowercase for URL
      count: '80+ Items',
      subcategories: [
        { name: 'Oxford Shoes', link: 'shoes?subcategory=oxford' },
        { name: 'Derby Shoes', link: 'shoes?subcategory=derby' },
        { name: 'Loafers', link: 'shoes?subcategory=loafers' },
        { name: 'Boots', link: 'shoes?subcategory=boots' },
      ],
      featured: {
        title: 'Premium Leather',
        description: 'Handcrafted from the finest materials.',
        link: 'shoes?subcategory=oxford',
      },
    },
    {
      id: 'Accessories',
      name: 'Accessories',
      image: '/images/ac3.jpg',
      description: 'Complete your look with our premium accessories collection.',
      link: 'accessories', // Use lowercase for URL
      count: '120+ Items',
      subcategories: [
        { name: 'Ties & Bow Ties', link: 'accessories?subcategory=ties' },
        { name: 'Belts', link: 'accessories?subcategory=belts' },
        { name: 'Cufflinks', link: 'accessories?subcategory=cufflinks' },
        { name: 'Pocket Squares', link: 'accessories?subcategory=pocket-squares' },
      ],
      featured: {
        title: 'Signature Accessories',
        description: 'Distinctive pieces that make a statement.',
        link: 'accessories?subcategory=ties',
      },
    },
  ], []);

  // Special offers - memoized to prevent re-creation
  const specialOffers = useMemo(() => [
    {
      title: 'Buy 1 Get 2 Free',
      description: 'Purchase any premium suit and get a second one free.',
      link: '/sale/bogo',
    },
    {
      title: 'Up to 40% Off',
      description: 'Limited time savings on select shoes and accessories.',
      link: '/sale',
    },
  ], []);

  // Customer testimonials - memoized to prevent re-creation
  const testimonials = useMemo(() => [
    {
      rating: 5,
      content:
        "The quality of ProMayouf's suits is exceptional. I've received countless compliments on my recent purchase.",
      author: 'James Wilson',
      location: 'New York, NY',
    },
    {
      rating: 5,
      content:
        "The attention to detail in their tailoring is remarkable. Best suit I've ever owned.",
      author: 'Robert Johnson',
      location: 'Chicago, IL',
    },
    {
      rating: 4.5,
      content:
        'Great customer service and the fit was perfect. Would definitely shop here again.',
      author: 'Michael Brown',
      location: 'Los Angeles, CA',
    },
  ], []);

  // Fetch home content
  const {
    data: homeContent,
    isLoading: homeContentLoading,
    error: homeContentError,
  } = useGetHomeContentQuery();

  // State for dynamic content
  const [heroSlides, setHeroSlides] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [featuredSuits, setFeaturedSuits] = useState([]);
  const [combinations, setCombinations] = useState([]);

  // Set content from API or fallback to static
  useEffect(() => {
    if (homeContent && !homeContentLoading) {
      // Use API data if available
      if (homeContent.heroSlides && homeContent.heroSlides.length > 0) {
        setHeroSlides(homeContent.heroSlides.map(slide => ({
          image: slide.image,
          title: slide.title,
          description: slide.description,
          link: slide.buttonLink,
          badge: slide.subtitle || 'Featured',
          buttonText: slide.buttonText || 'Shop Now',
        })));
      } else {
        // Fallback to static data
        setHeroSlides([
          {
            image: '/images/1.jpg',
            title: 'Refined Elegance For Every Occasion',
            description: 'Explore our new collection of premium suits designed for the modern gentleman.',
            link: '/sale',
            badge: 'New Arrivals',
            buttonText: 'Shop Now',
          },
          {
            image: '/images/2.jpg',
            title: 'Summer Sale Up To 50% Off',
            description: "Limited time offers on select styles and accessories. Shop now before they're gone.",
            link: '/sale',
            badge: 'Limited Time',
            buttonText: 'Shop Sale',
          },
        ]);
      }

      // Set collections if available
      if (homeContent.collections && homeContent.collections.length > 0) {
        setDynamicCategories(homeContent.collections.map(collection => ({
          id: collection.category,
          name: collection.name,
          image: collection.image,
          description: collection.description,
          link: collection.link,
          count: `${collection.category} Collection`,
        })));
      }

      // Set featured suits if available
      if (homeContent.featuredSuits && homeContent.featuredSuits.length > 0) {
        setFeaturedSuits(homeContent.featuredSuits.map(suit => {
          // Handle different data structures from API
          const productData = suit.productId || suit;
          
          return {
            ...productData,
            _id: productData._id || productData.id,
            customTitle: suit.title || suit.customTitle,
            customDescription: suit.description || suit.customDescription,
          customImage: suit.customImage,
            // Ensure we have required fields for cart functionality
            name: productData.name || suit.title || 'Featured Suit',
            price: productData.price || 0,
            image: suit.customImage || productData.image || '/images/sample.jpg',
            category: productData.category || 'Suits',
            brand: productData.brand || 'ProMayouf',
            countInStock: productData.countInStock || 10,
            rating: productData.rating || 4.5,
            numReviews: productData.numReviews || 0
          };
        }));
      }

      // Set combinations if available (fallback to sample data)
      if (homeContent.perfectCombinations && homeContent.perfectCombinations.length > 0) {
        setCombinations(homeContent.perfectCombinations);
      } else {
        // Sample combinations data with proper images from available assets
        setCombinations([
          {
            _id: 'combo-1',
            name: 'Executive Business Look',
            description: 'Perfect combination for boardroom meetings and business events. This sophisticated ensemble combines classic navy tailoring with premium leather accessories.',
            suit: {
              _id: 'suit-1',
              name: 'Navy Business Suit',
              image: '/images/1.jpg',
              price: 899,
              category: 'Suits',
              brand: 'ProMayouf',
              countInStock: 15,
              rating: 4.9,
              numReviews: 87,
              description: 'Premium navy wool suit with modern slim fit. Perfect for business and formal occasions.'
            },
            shoes: {
              _id: 'shoes-1',
              name: 'Black Oxford Shoes',
              image: '/images/s1.jpg',
              price: 299,
              category: 'Shoes',
              brand: 'ProMayouf',
              countInStock: 25,
              rating: 4.7,
              numReviews: 45,
              description: 'Handcrafted Italian leather Oxford shoes with classic design.'
            },
            accessories: {
              _id: 'accessories-1',
              name: 'Silk Tie & Cufflinks Set',
              image: '/images/ac1.jpg',
              price: 149,
              category: 'Accessories',
              brand: 'ProMayouf',
              countInStock: 30,
              rating: 4.6,
              numReviews: 23,
              description: 'Premium silk tie with matching cufflinks in elegant silver finish.'
            },
            totalPrice: 1347,
            discountedPrice: 1199,
            savings: 148,
            rating: 4.9,
            numReviews: 87,
            isActive: true,
            isFeatured: true
          },
          {
            _id: 'combo-2',
            name: 'Wedding Elegance',
            description: 'Sophisticated ensemble for your special day. This timeless combination exudes elegance and refinement for the most important moments.',
            suit: {
              _id: 'suit-2',
              name: 'Charcoal Three-Piece Suit',
              image: '/images/5.jpg',
              price: 1299,
              category: 'Suits',
              brand: 'ProMayouf',
              countInStock: 8,
              rating: 4.8,
              numReviews: 64,
              description: 'Luxurious charcoal wool three-piece suit with vest. Perfect for weddings and formal events.'
            },
            shoes: {
              _id: 'shoes-2',
              name: 'Brown Derby Shoes',
              image: '/images/s1.jpg',
              price: 349,
              category: 'Shoes',
              brand: 'ProMayouf',
              countInStock: 12,
              rating: 4.5,
              numReviews: 32,
              description: 'Premium brown leather Derby shoes with sophisticated brogue detailing.'
            },
            accessories: {
              _id: 'accessories-2',
              name: 'Pocket Square & Belt Set',
              image: '/images/ac7.jpg',
              price: 199,
              category: 'Accessories',
              brand: 'ProMayouf',
              countInStock: 18,
              rating: 4.4,
              numReviews: 28,
              description: 'Elegant pocket square and leather belt set in coordinating brown tones.'
            },
            totalPrice: 1847,
            discountedPrice: 1599,
            savings: 248,
            rating: 4.8,
            numReviews: 64,
            isActive: true,
            isFeatured: true
          },
          {
            _id: 'combo-3',
            name: 'Modern Professional',
            description: 'Contemporary styling for the modern professional. This versatile combination works perfectly for client meetings and networking events.',
            suit: {
              _id: 'suit-3',
              name: 'Slim Fit Grey Suit',
              image: '/images/3.jpg',
              price: 749,
              category: 'Suits',
              brand: 'ProMayouf',
              countInStock: 20,
              rating: 4.6,
              numReviews: 52,
              description: 'Modern slim-fit grey suit with contemporary styling and premium fabric.'
            },
            shoes: {
              _id: 'shoes-3',
              name: 'Black Leather Loafers',
              image: '/images/s4.jpg',
              price: 249,
              category: 'Shoes',
              brand: 'ProMayouf',
              countInStock: 35,
              rating: 4.3,
              numReviews: 41,
              description: 'Comfortable black leather loafers with modern design and superior comfort.'
            },
            accessories: {
              _id: 'accessories-3',
              name: 'Modern Watch & Wallet Set',
              image: '/images/ac3.jpg',
              price: 299,
              category: 'Accessories',
              brand: 'ProMayouf',
              countInStock: 22,
              rating: 4.7,
              numReviews: 38,
              description: 'Sleek modern watch with matching leather wallet in sophisticated black.'
            },
            totalPrice: 1297,
            discountedPrice: 1099,
            savings: 198,
            rating: 4.6,
            numReviews: 52,
            isActive: true,
            isFeatured: false
          },
          {
            _id: 'combo-4',
            name: 'Classic Gentleman',
            description: 'Timeless elegance for the distinguished gentleman. This classic combination never goes out of style and works for any formal occasion.',
            suit: {
              _id: 'suit-4',
              name: 'Classic Black Tuxedo',
              image: '/images/6.jpg',
              price: 1599,
              category: 'Suits',
              brand: 'ProMayouf',
              countInStock: 5,
              rating: 5.0,
              numReviews: 29,
              description: 'Premium black tuxedo with satin lapels. Perfect for black-tie events and galas.'
            },
            shoes: {
              _id: 'shoes-4',
              name: 'Patent Leather Dress Shoes',
              image: '/images/s2.jpg',
              price: 399,
              category: 'Shoes',
              brand: 'ProMayouf',
              countInStock: 8,
              rating: 4.9,
              numReviews: 15,
              description: 'Elegant patent leather dress shoes with mirror finish for formal occasions.'
            },
            accessories: {
              _id: 'accessories-4',
              name: 'Bow Tie & Cummerbund Set',
              image: '/images/ac6.jpg',
              price: 179,
              category: 'Accessories',
              brand: 'ProMayouf',
              countInStock: 12,
              rating: 4.8,
              numReviews: 19,
              description: 'Classic black bow tie and cummerbund set for formal evening wear.'
            },
            totalPrice: 2177,
            discountedPrice: 1899,
            savings: 278,
            rating: 5.0,
            numReviews: 29,
            isActive: true,
            isFeatured: true
          },
          {
            _id: 'combo-3',
            name: 'Casual Professional',
            description: 'Smart casual look for modern workplace.',
            suit: {
              name: 'Light Grey Blazer',
              image: '/images/12.jpg',
              price: 599,
              category: 'Blazers'
            },
            shoes: {
              name: 'Leather Loafers',
              image: '/images/s3.jpg',
              price: 249,
              category: 'Shoes'
            },
            accessories: {
              name: 'Casual Belt & Watch',
              image: '/images/ac2.jpg',
              price: 179,
              category: 'Accessories'
            },
            totalPrice: 1027,
            discountedPrice: 899,
            savings: 128,
            rating: 4.7,
            numReviews: 52
          },
          {
            _id: 'combo-4',
            name: 'Evening Formal',
            description: 'Distinguished look for formal evening events.',
            suit: {
              name: 'Black Tuxedo',
              image: '/images/8.jpg',
              price: 1599,
              category: 'Tuxedos'
            },
            shoes: {
              name: 'Patent Leather Shoes',
              image: '/images/s3.jpg',
              price: 399,
              category: 'Shoes'
            },
            accessories: {
              name: 'Bow Tie & Cummerbund Set',
              image: '/images/ac2.jpg',
              price: 229,
              category: 'Accessories'
            },
            totalPrice: 2227,
            discountedPrice: 1999,
            savings: 228,
            rating: 4.9,
            numReviews: 73
          }
        ]);
      }
    } else {
      // Fallback to static data when no API data
      setHeroSlides([
        {
          image: '/images/1.jpg',
          title: 'Refined Elegance For Every Occasion',
          description: 'Explore our new collection of premium suits designed for the modern gentleman.',
          link: '/sale',
          badge: 'New Arrivals',
          buttonText: 'Shop Now',
        },
        {
          image: '/images/2.jpg',
          title: 'Summer Sale Up To 50% Off',
          description: "Limited time offers on select styles and accessories. Shop now before they're gone.",
          link: '/sale',
          badge: 'Limited Time',
          buttonText: 'Shop Sale',
        },
      ]);

      // Set sample combinations data
      setCombinations([
        {
          _id: 'combo-1',
          name: 'Executive Business Look',
          description: 'Perfect combination for boardroom meetings and business events.',
          suit: {
            name: 'Navy Business Suit',
            image: '/images/1.jpg',
            price: 899,
            category: 'Suits'
          },
          shoes: {
            name: 'Black Oxford Shoes',
            image: '/images/s2.jpg',
            price: 299,
            category: 'Shoes'
          },
          accessories: {
            name: 'Silk Tie & Cufflinks Set',
            image: '/images/ac1.jpg',
            price: 149,
            category: 'Accessories'
          },
          totalPrice: 1347,
          discountedPrice: 1199,
          savings: 148,
          rating: 4.9,
          numReviews: 87
        },
        {
          _id: 'combo-2',
          name: 'Wedding Elegance',
          description: 'Sophisticated ensemble for your special day.',
          suit: {
            name: 'Charcoal Three-Piece Suit',
            image: '/images/2.jpg',
            price: 1299,
            category: 'Suits'
          },
          shoes: {
            name: 'Brown Derby Shoes',
            image: '/images/s2.jpg',
            price: 349,
            category: 'Shoes'
          },
          accessories: {
            name: 'Pocket Square & Belt Set',
            image: '/images/2.jpg',
            price: 199,
            category: 'Accessories'
          },
          totalPrice: 1847,
          discountedPrice: 1599,
          savings: 248,
          rating: 4.8,
          numReviews: 64
        },
        {
          _id: 'combo-3',
          name: 'Modern Professional',
          description: 'Contemporary style for the modern professional.',
          suit: {
            name: 'Charcoal Grey Suit',
            image: '/images/sample.jpg',
            price: 799,
            category: 'Suits'
          },
          shoes: {
            name: 'Brown Leather Brogues',
            image: '/images/s1.jpg',
            price: 249,
            category: 'Shoes'
          },
          accessories: {
            name: 'Leather Belt & Watch',
            image: '/images/ac2.jpg',
            price: 199,
            category: 'Accessories'
          },
          totalPrice: 1247,
          discountedPrice: 1099,
          savings: 148,
          rating: 4.7,
          numReviews: 52
        }
      ]);
    }
  }, [homeContent, homeContentLoading]);

  // Track scroll position for animations - throttled
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollPosition(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for animations - optimized
  useEffect(() => {
    const observedElements = new Set();
    
    const callback = (entries) => {
      entries.forEach((entry) => {
        const elementId = entry.target.id;
        if (entry.isIntersecting && !observedElements.has(elementId)) {
          setVisibleSection(elementId);
          setAnimatedElements((prev) => ({
            ...prev,
            [elementId]: true,
          }));
          observedElements.add(elementId);
        }
      });
    };

    const observer = new IntersectionObserver(callback, { 
      threshold: 0.2,
      rootMargin: '50px 0px'
    });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  // Enhanced scroll animations for new sections - optimized
  useEffect(() => {
    if (!data) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const animationCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Special handling for Hugo Boss featured products
          if (entry.target.classList.contains('featured-products-hugo')) {
            const hugoItems = entry.target.querySelectorAll('.hugo-product-item');
            hugoItems.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('fade-in-up');
              }, index * 100);
            });
          }
        }
      });
    };

    const animationObserver = new IntersectionObserver(animationCallback, observerOptions);

    // Observe fade-in-up elements
    const fadeElements = document.querySelectorAll('.fade-in-up:not(.visible)');
    fadeElements.forEach((element) => animationObserver.observe(element));
    
    // Observe Hugo Boss featured products section
    const hugoBossSection = document.querySelector('.featured-products-hugo');
    if (hugoBossSection) {
      animationObserver.observe(hugoBossSection);
    }

    return () => animationObserver.disconnect();
  }, [data]);

  // Get scroll to top function for manual use
  const scrollToTopFunction = useScrollToTop({ onMount: false, onLocationChange: false });

  // Navigation functions - memoized
  const navigateToCategory = useCallback((categoryPath) => {
    if (!categoryPath) return;

    // Handle paths with query parameters (subcategories)
    if (categoryPath.includes('?')) {
      const [category, queryString] = categoryPath.split('?');
      navigate({
        pathname: `/category/${category.toLowerCase()}`, // Convert to lowercase
        search: `?${queryString}`
      });
    } else {
      // Direct category navigation - convert to lowercase
      navigate(`/category/${categoryPath.toLowerCase()}`);
    }
    // Use the scroll function from the hook for consistency
    setTimeout(() => scrollToTopFunction(), 100);
  }, [navigate, scrollToTopFunction]);

  const navigateToProduct = useCallback((productId) => {
    if (!productId) {
      console.error('Product ID is missing');
      toast.error('Product not found');
      return;
    }
    
    // Validate MongoDB ObjectId format (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(productId)) {
      console.error('Invalid product ID format:', productId);
      toast.error('Invalid product ID');
      return;
    }
    
    navigate(`/product/${productId}`, {
      state: { from: `${location.pathname}${location.search}` }
    });
  }, [navigate, location.pathname, location.search]);

  const navigateToViewAll = useCallback(() => {
    // Navigate to the homepage with page parameter instead of /products which doesn't exist
    navigate('/page/1');
    // Use the scroll function from the hook for consistency
    setTimeout(() => scrollToTopFunction(), 100);
  }, [navigate, scrollToTopFunction]);

  // Add a function to filter products by category - memoized
  const filterByCategory = useCallback((category) => {
    if (!category) return;

    setActiveCategory(category); // Keep proper case for API calls
    setActiveSubcategory(''); // Reset subcategory when changing category

    const params = new URLSearchParams(location.search);
    params.set('category', category); // Use proper case for API
    params.delete('subcategory');

    // Use lowercase for URL navigation
    const urlCategory = category.toLowerCase();
    navigate({
      pathname: `/category/${urlCategory}`,
      search: ''
    });
  }, [location.search, navigate]);

  // Handle wishlist toggle - memoized
  const toggleWishlist = useCallback((product) => {
    dispatch(toggleWishlistItem({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      brand: product.brand,
      category: product.category
    }));

    const isInWishlist = wishlistItems.some(item => item._id === product._id);
    setToastMessage(isInWishlist ? 'Product removed from wishlist' : 'Added to wishlist');
    setShowToast(true);
  }, [dispatch, wishlistItems]);

  // Handle direct add to cart - memoized
  const handleAddToCart = useCallback((product, qty = 1) => {
    // If the product has sizes, navigate to product detail page to select size
    if (product.sizes && product.sizes.length > 0) {
      navigate(`/product/${product._id}`, {
        state: { from: `${location.pathname}${location.search}` },
      });
      toast.info('Please select a size before adding to cart');
      return;
    }

    dispatch(
      addToCart({
        ...product,
        qty,
        product: product._id,
      })
    );
    setToastMessage(`${product.name} added to cart!`);
    setShowToast(true);
  }, [dispatch, navigate, location.pathname, location.search]);

  // Handle quick view - memoized
  const handleQuickView = useCallback((product) => {
    // For combination items, create a complete product object with safe defaults
    const enhancedProduct = {
      ...product,
            // Generate a safe ID for combination items that won't conflict with real products
      _id: product._id && product._id.startsWith('combo-') ? product._id : 
           product._id || product.id || `combo-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // Ensure we have required fields
      name: product.name || product.customTitle || 'Product',
      price: product.price || 0,
      image: product.image || '/images/placeholder.jpg',
      category: product.category || 'Product',
      brand: product.brand || 'ProMayouf',
      countInStock: product.countInStock || 10,
      rating: product.rating || 4.5,
      numReviews: product.numReviews || 0,
      description: product.description || 'Premium quality product from ProMayouf collection.',
      // Optional fields with defaults
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      // Mark as combination item to prevent database lookups
      isCombinationItem: true,
      // Add safe defaults for other expected fields
      subCategory: product.subCategory || product.category?.toLowerCase() || 'general',
      material: product.material || 'Premium',
      fit: product.fit || 'Regular',
      style: product.style || 'Classic'
    };

    setQuickViewProduct(enhancedProduct);
    setQuickViewQty(1);
    setShowQuickView(true);
  }, []);

  // Filter and sort products - optimized with useMemo
  const { filteredAndSortedProducts, productCounts } = useMemo(() => {
    if (!data?.products) {
      return { filteredAndSortedProducts: [], productCounts: { total: 0, filtered: 0 } };
    }

    let filtered = [...data.products];
    const originalCount = filtered.length;

    // API level filtering should already be applied for activeCategory and activeSubcategory
    // This is just a fallback in case we need client-side filtering
    if (activeCategory && !filtered.some(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase())) {
      filtered = filtered.filter((p) => {
        return p.category && p.category.toLowerCase() === activeCategory.toLowerCase();
      });
    }

    // Apply subcategory filter if it exists
    if (activeSubcategory && !filtered.some(p => p.subCategory && p.subCategory.toLowerCase() === activeSubcategory.toLowerCase())) {
      filtered = filtered.filter((p) => {
        // Case-insensitive matching
        const targetSubCategory = activeSubcategory.toLowerCase();

        // Check main subCategory field
        if (p.subCategory) {
          return p.subCategory.toLowerCase() === targetSubCategory;
        }

        // Check multi-valued subcategories array if it exists
        if (p.subcategories && Array.isArray(p.subcategories)) {
          return p.subcategories.some(sc => {
            if (typeof sc === 'string') {
              return sc.toLowerCase() === targetSubCategory;
            }
            return sc.name?.toLowerCase() === targetSubCategory;
          });
        }

        return false;
      });
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const price = p.price || 0;
        if (priceFilter === 'under100') return price < 100;
        if (priceFilter === 'between100and200') return price >= 100 && price <= 200;
        if (priceFilter === 'over200') return price > 200;
        return true;
      });
    }

    // Apply sorting
    if (sortBy !== 'newest') {
      filtered.sort((a, b) => {
        if (sortBy === 'priceAsc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'priceDesc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'name') return a.name?.localeCompare(b.name);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
    }

    return {
      filteredAndSortedProducts: filtered,
      productCounts: {
        total: originalCount,
        filtered: filtered.length
      }
    };
  }, [data?.products, activeCategory, activeSubcategory, priceFilter, sortBy]);

  // Update filteredProducts when computation changes
  useEffect(() => {
    setFilteredProducts(filteredAndSortedProducts);

    // Show toast about filtered results when subcategory is present OR when search results are displayed
    if (activeSubcategory && filteredAndSortedProducts.length > 0) {
      setToastMessage(
        `Viewing ${filteredAndSortedProducts.length} ${
          activeSubcategory.charAt(0).toUpperCase() + activeSubcategory.slice(1)
        } products`
      );
      setShowToast(true);
    } else if (keyword && filteredAndSortedProducts.length > 0) {
      setToastMessage(
        `Found ${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length === 1 ? '' : 's'} for "${keyword}"`
      );
      setShowToast(true);
    }
  }, [filteredAndSortedProducts, activeSubcategory, keyword]);

  // Render rating stars - memoized
  const renderRatingStars = useCallback((rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} />);
      } else {
        stars.push(<FaStar key={i} style={{ opacity: 0.3 }} />);
      }
    }
    return stars;
  }, []);

  // Handler for chatbot recommendations - memoized
  const handleSizeRecommendation = useCallback((recommendation) => {
    setChatbotOpen(false);
    setToastMessage(`Size recommendation: ${recommendation.size}`);
    setShowToast(true);
  }, []);

  // User Info Chatbot handlers - memoized
  const handleUserInfoChatbotOpen = useCallback(() => {
    setShowUserInfoChatbot(true);
  }, []);

  const handleUserInfoChatbotClose = useCallback(() => {
    setShowUserInfoChatbot(false);
  }, []);

  const handleChatbotRecommendations = useCallback((recommendations) => {
    setShowUserInfoChatbot(false);
    
    // Show success message
    toast.success(`Perfect! Found ${recommendations.size} suits in ${recommendations.fitStyle} that match your preferences.`);
    
    // Navigate to filtered products based on recommendations
    const searchParams = new URLSearchParams();
    
    // Add category filter
    if (recommendations.category) {
      searchParams.set('category', recommendations.category);
    }
    
    // Add color filter if available
    if (recommendations.colors && recommendations.colors.length > 0) {
      searchParams.set('colors', recommendations.colors.join(','));
    }
    
    // Add price range filter
    if (recommendations.priceRange) {
      searchParams.set('minPrice', recommendations.priceRange.min.toString());
      searchParams.set('maxPrice', recommendations.priceRange.max.toString());
    }
    
    // Add reason/occasion filter
    if (recommendations.reason) {
      searchParams.set('occasion', recommendations.reason);
    }
    
    // Navigate to category page with filters
    navigate({
      pathname: `/category/${recommendations.category || 'Suits'}`,
      search: `?${searchParams.toString()}`
    });
  }, [navigate]);

  // Prevent scrolling when quick view is open
  useEffect(() => {
    if (showQuickView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showQuickView]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Close quick view modal - memoized
  const closeQuickView = useCallback(() => {
    setShowQuickView(false);
    setTimeout(() => {
      setQuickViewProduct(null);
    }, 300);
  }, []);

  // Handle quantity changes in quick view - memoized
  const handleIncreaseQty = useCallback(() => {
    if (quickViewQty < 10) setQuickViewQty(quickViewQty + 1);
  }, [quickViewQty]);

  const handleDecreaseQty = useCallback(() => {
    if (quickViewQty > 1) setQuickViewQty(quickViewQty - 1);
  }, [quickViewQty]);

  // Add to cart from quick view - memoized
  const addToCartFromQuickView = useCallback(() => {
    if (quickViewProduct) {
      // If the product has sizes, navigate to product detail page to select size
      if (quickViewProduct.sizes && quickViewProduct.sizes.length > 0) {
        closeQuickView();
        navigate(`/product/${quickViewProduct._id}`, {
          state: { from: `${location.pathname}${location.search}` },
        });
        toast.info('Please select a size before adding to cart');
        return;
      }

      handleAddToCart(quickViewProduct, quickViewQty);
      closeQuickView();
    }
  }, [quickViewProduct, quickViewQty, handleAddToCart, closeQuickView, navigate, location.pathname, location.search]);

  // Alias for QuickViewModal compatibility
  const handleQuickViewAddToCart = addToCartFromQuickView;

  // Perfect Combinations handlers - memoized
  const handleViewCombinationDetails = useCallback((combination) => {
    setSelectedCombination(combination);
    setShowCombinationModal(true);
  }, []);

  const handleAddCompleteSet = useCallback((combination) => {
    try {
      // Add all items from the combination to cart
      const timestamp = Date.now();
      const items = [
        { ...combination.suit, qty: 1, type: 'suit' },
        { ...combination.shoes, qty: 1, type: 'shoes' },
        { ...combination.accessories, qty: 1, type: 'accessories' }
      ];

      let addedCount = 0;

      items.forEach((item, index) => {
        const cartItem = {
          _id: `combo-${combination._id}-${item.type}-${timestamp}-${index}`, // Unique ID for each combination item
          name: item.name,
          image: getFullImageUrl(item.image), // Use getFullImageUrl to ensure proper image path
          price: parseFloat(item.price) || 0,
          category: item.category,
          subCategory: item.category.toLowerCase(),
          qty: 1,
          countInStock: 50, // Default stock for combination items
          brand: 'ProMayouf',
          description: `${item.name} from ${combination.name} combination`,
          rating: 4.5,
          numReviews: 10,
          material: 'Premium',
          color: 'As Shown',
          fit: 'Regular',
          style: 'Business',
          isComboItem: true,
          combinationId: combination._id,
          combinationType: item.type,
          product: `combo-${combination._id}-${item.type}` // For cart compatibility
        };

        dispatch(addToCart(cartItem));
        addedCount++;
      });

      if (addedCount === items.length) {
        toast.success(`Complete ${combination.name} set added to cart! (${addedCount} items)`);
      } else {
        toast.warning(`${addedCount} of ${items.length} items added to cart`);
      }
    } catch (error) {
      console.error('Error adding complete set to cart:', error);
      toast.error('Failed to add complete set to cart. Please try again.');
    }
  }, [dispatch]);

  const closeCombinationModal = useCallback(() => {
    setShowCombinationModal(false);
    setTimeout(() => {
      setSelectedCombination(null);
    }, 300);
  }, []);

  return (
    <>
      <Meta title="ProMayouf - Premium Men's Fashion & Suits" />
      {/* Toast notification */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={2500}
        autohide
        className='position-fixed bottom-0 end-0 m-4'
        style={{ zIndex: 1000 }}
      >
        <Toast.Header>
          <strong className='me-auto'>Notification</strong>
        </Toast.Header>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>

      {/* Quick View Modal - Using the dedicated QuickViewModal component */}

      {/* Check if keyword exists OR activeSubcategory exists before rendering this section */}
      {(keyword || activeSubcategory) && (
        <div className="moores-search-section">
          <Container className='py-4'>
            {/* Breadcrumb Navigation */}
            <nav className="moores-breadcrumb mb-4">
              {location.state?.from ? (
                <Link
                  to={location.state.from}
                  className='moores-breadcrumb-link'
                >
                  <FaArrowLeft className='me-2' /> Back to{' '}
                  {urlCategory
                    ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1)
                    : 'Results'}
                </Link>
              ) : (
                <Link to='/' className='moores-breadcrumb-link'>
                  <FaArrowLeft className='me-2' /> Back to Home
                </Link>
              )}
            </nav>

            {/* Search Header */}
            <div className="moores-search-header mb-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h1 className="moores-search-title">
                    {keyword ? (
                      <>Search Results for "{keyword}"</>
                    ) : (
                      <>
                        {urlCategory
                          ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1)
                          : ''}{' > '}
                        {activeSubcategory.charAt(0).toUpperCase() + activeSubcategory.slice(1)}
                      </>
                    )}
                  </h1>
                  <p className="moores-search-subtitle">
                    {filteredProducts.length} products found
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <Button
                    variant="outline-dark"
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="moores-filter-btn"
                    aria-expanded={filterOpen}
                    aria-controls="filter-panel"
                  >
                    <FaFilter className="me-2" /> Filter & Sort
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="moores-loader text-center py-5">
                <Loader />
              </div>
            ) : error ? (
              <div className="moores-error text-center py-5">
                <Message variant='danger'>
                  {error?.data?.message || error.error}
                </Message>
              </div>
            ) : (
              <>
                {/* Filter Panel */}
                {filterOpen && (
                  <div className="moores-filter-panel mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <Row>
                          <Col md={5}>
                            <Form.Group>
                              <Form.Label className="moores-filter-label">
                                <FaFilter className='me-2' /> Price Range
                              </Form.Label>
                              <Form.Select
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value)}
                                className="moores-filter-select"
                              >
                                <option value='all'>All Prices</option>
                                <option value='under100'>Under $100</option>
                                <option value='between100and200'>$100 - $200</option>
                                <option value='over200'>Over $200</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={5}>
                            <Form.Group>
                              <Form.Label className="moores-filter-label">
                                <FaSortAmountDown className='me-2' /> Sort By
                              </Form.Label>
                              <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="moores-filter-select"
                              >
                                <option value='newest'>Newest First</option>
                                <option value='priceAsc'>Price: Low to High</option>
                                <option value='priceDesc'>Price: High to Low</option>
                                <option value='name'>Name: A to Z</option>
                                <option value='rating'>Best Rated</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={2} className='d-flex align-items-end'>
                            <Button
                              variant="outline-secondary"
                              className="w-100 moores-reset-btn"
                              onClick={() => {
                                setPriceFilter('all');
                                setSortBy('newest');
                              }}
                            >
                              Reset
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {/* Products Grid */}
                <div className="moores-search-grid">
                  {filteredProducts.length === 0 ? (
                    <div className="moores-no-results">
                      <div className="text-center py-5">
                        <h3>No products found</h3>
                        <p className="text-muted">Try adjusting your search criteria or browse our categories.</p>
                        <Button variant="primary" onClick={() => navigate('/category/suits')}>
                          Browse All Products
                        </Button>
                      </div>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <UniversalProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={(prod) => handleAddToCart(prod)}
                        onToggleWishlist={(prod) => toggleWishlist(prod)}
                        onQuickView={(prod) => handleQuickView(prod)}
                        isInWishlist={wishlistItems.some(item => item._id === product._id)}
                        categoryColor={
                          product.category === 'Suits' ? '#007bff' :
                          product.category === 'Shoes' ? '#28a745' :
                          product.category === 'Accessories' ? '#ffc107' : '#6c757d'
                        }
                      />
                    ))
                  )}
                </div>

                {/* Pagination */}
                <div className='d-flex justify-content-center mt-5'>
                  <Paginate
                    pages={data.pages}
                    page={data.page}
                    keyword={keyword}
                  />
                </div>
              </>
            )}
          </Container>
        </div>
      )}

      {!keyword && !activeSubcategory && (
        <>
          {/* Flash Sale Banner - Compact Top Banner */}
          <section className="flash-sale-banner py-2 mb-3">
            <Container fluid>
              <div className="flash-sale-container position-relative overflow-hidden"
                   style={{
                     background: 'linear-gradient(90deg, #ff4e50, #f9d423)',
                     borderRadius: '8px',
                     boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                     height: '70px'
                   }}>
                <Row className="align-items-center h-100 px-3">
                  <Col xs={12} className="text-white">
                    <div className="flash-sale-content d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center flex-wrap">
                        <FaPercent className="flash-icon me-2" size={18} />
                        <span className="flash-label me-2 me-md-3" style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)', fontWeight: 'bold' }}>
                          FLASH SALE
                        </span>
                        <span className="flash-title d-none d-sm-inline" style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)', fontWeight: '600' }}>
                          UP TO 70% OFF - 48 HOURS ONLY!
                        </span>
                        <span className="flash-title d-sm-none" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          UP TO 70% OFF
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="flash-sale-timer me-2 me-md-3 d-none d-md-block" style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '4px 12px',
                          borderRadius: '15px',
                          fontSize: '0.85rem'
                        }}>
                          <FaRegClock className="me-1" size={12} />
                          <span>47:59:59</span>
                        </div>
                        <Button
                          variant="light"
                          size="sm"
                          className="fw-bold"
                          onClick={() => navigate('/sale')}
                          style={{
                            fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                            padding: 'clamp(4px, 1vw, 6px) clamp(12px, 3vw, 16px)',
                            borderRadius: '18px'
                          }}
                        >
                          SHOP NOW
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Container>
          </section>

          {/* Hero Section */}
          <section className='hero-section'>
            <Carousel
              fade
              interval={6000}
              pause='hover'
              className='hero-slider'
            >
              {heroSlides.map((slide, index) => (
                <Carousel.Item key={index}>
                  <div
                    className='hero-slide'
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <div className="hero-gradient-overlay"></div>
                    <Container>
                      <div className='hero-content'>
                        <div className='hero-badge'>{slide.badge}</div>
                        <h1 className='hero-title'>{slide.title}</h1>
                        <p className='hero-description'>{slide.description}</p>

                      </div>
                    </Container>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </section>

          {/* Featured Products - Hugo Boss Inspired */}
          <section
            id='featuredProducts'
            className={`featured-products-hugo ${
              animatedElements.featuredProducts ? 'section-visible' : ''
            }`}
          >
            <Container fluid className="px-0">
              <div className='hugo-section-header'>
                <Container>
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <div className="hugo-title-block">
                        <span className="hugo-subtitle">FEATURED COLLECTION</span>
                        <h2 className="hugo-main-title">Featured Suits</h2>
                        <p className="hugo-description">
                          Our highest-rated and best-selling suits, chosen by customers for exceptional quality, perfect fit, and outstanding craftsmanship.
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                      <div className="hugo-controls">
                        <div className="hugo-filter-bar">
                          <span className="hugo-filter-label">Sort by:</span>
                          <select 
                            className="hugo-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="featured">Featured</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                          </select>
                        </div>
                        <div className="hugo-product-count">
                          {data?.products ? `${Math.min(4, data.products.filter(p => p.category === 'Suits').length)} of ${data.products.filter(p => p.category === 'Suits').length} suits` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </div>

              <Container className="hugo-products-container">
          {isLoading ? (
                  <div className="hugo-loader text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading featured suits...</p>
            </div>
          ) : error ? (
                  <div className="hugo-error text-center py-5">
                    <Alert variant="danger">
                      Error loading products. Please try again later.
                    </Alert>
                  </div>
              ) : (
                <>
                    <div className="hugo-products-grid-four">
                      {data?.products && data.products
                        .filter(product => product.category === 'Suits')
                        .sort((a, b) => {
                          switch (sortBy) {
                            case 'newest':
                              return new Date(b.createdAt) - new Date(a.createdAt);
                            case 'price-low':
                              const priceA = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceA - priceB;
                            case 'price-high':
                              const priceA2 = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB2 = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceB2 - priceA2;
                            case 'rating':
                              return (b.rating || 0) - (a.rating || 0);
                            case 'featured':
                            default:
                              // Featured products - prioritize by rating and reviews
                              const scoreA = (a.rating || 0) * (a.numReviews || 0);
                              const scoreB = (b.rating || 0) * (b.numReviews || 0);
                              return scoreB - scoreA;
                          }
                        })
                        .slice(0, 4)
                        .map((product, index) => (
                        <div 
                          key={product._id} 
                          className="hugo-product-item"
                          style={{ '--delay': `${index * 0.1}s` }}
                        >
                          <div className="hugo-product-card">
                            <div className="hugo-product-image-container">
                              <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                                      src={getFullImageUrl(product.image)}
                                      alt={product.name}
                                    className="hugo-product-image"
                                    loading="lazy"
                                    />
                                    <div className="hugo-image-overlay">
                                      <span className="hugo-view-text">View Product</span>
                                    </div>
                                  </div>
                                </Link>
                                
                              {/* Discount Badge */}
                              {product.salePrice && product.salePrice < product.price && (
                                <div className="hugo-discount-badge">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                              {/* Product Actions */}
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

                  <div className="hugo-view-all-section">
                    <Container>
                      <div className='hugo-view-all-content'>
                        <div className="hugo-view-all-text">
                          <h3>Explore Our Complete Suits Collection</h3>
                            <p>Discover the full range of premium suits designed for the modern gentleman</p>
                        </div>
                        <button
                          className='hugo-view-all-btn'
                            onClick={() => navigate('/category/suits')}
                        >
                          <span>View All Suits</span>
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

          {/* Category Product Showcases */}
          <section
            id='categoryShowcase'
            className={`category-showcase ${
              animatedElements.categoryShowcase ? 'section-visible' : ''
            }`}
          >
            <Container>
              <div className='section-title text-center mb-5'>
                <h2 className='section-heading'>Shop Our Collections</h2>
                <div className='fancy-divider'>
                  <span></span>
                </div>
                <p className='text-muted mx-auto' style={{ maxWidth: '700px' }}>
                  Discover our premium selection of suits, shoes, and
                  accessories crafted for the modern gentleman.
                </p>
              </div>
            <Row>
                {(dynamicCategories.length > 0 ? dynamicCategories : categories).map((category, index) => (
                  <Col lg={4} md={6} key={category.id || category._id} className='mb-5'>
                    <div
                      className='category-card-enhanced fade-in-up'
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className='category-image-enhanced'>
                        <img
                          src={getFullImageUrl(category.image)}
                          alt={category.name}
                          onError={(e) => handleImageError(e, '/images/1.jpg')}
                        />
                        <div className='category-overlay-enhanced'>
                          <Link
                            to={`/category/${category.link}`}
                            className='category-cta'
                          >
                            Explore Collection <FaArrowRight className='ms-2' />
                          </Link>
                        </div>
                      </div>
                      <div className='category-content-enhanced'>
                        <h3 className='category-title-enhanced'>{category.name}</h3>
                        <p className='category-description-enhanced'>
                          {category.description}
                        </p>
                        <div className='category-subcategories mb-3'>
                          <h6 className='subcategory-heading'>
                            Popular Categories
                          </h6>
                          <Row>
                            {category.subcategories.map((subcategory, idx) => (
                              <Col xs={6} key={idx}>
                                <Button
                                  variant='link'
                                  className='subcategory-link p-0 mb-2'
                                  onClick={() =>
                                    navigateToCategory(subcategory.link)
                                  }
                                >
                                  <FaArrowRight className='me-1' size={10} />
                                  {subcategory.name}
                                </Button>
                              </Col>
                            ))}
                          </Row>
                        </div>
                        <div className='category-stats'>
                          <span className='category-count-enhanced'>{category.count}</span>
                          <FaArrowRight className='category-arrow' />
                        </div>
                        <Button
                          className='category-btn w-100 mt-3'
                          onClick={() => navigateToCategory(category.id)}
                        >
                          Shop All {category.name}
                        </Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

         

          {/* Perfect Combinations Section */}
          {combinations.length > 0 && (
            <section
              id='combinations'
              className={`combinations-section ${
                animatedElements.combinations ? 'section-visible' : ''
              }`}
            >
              <Container>
                <div className='section-title text-center mb-5'>
                  <h2 className='section-heading'>Perfect Combinations</h2>
                  <div className='fancy-divider'>
                    <span></span>
                  </div>
                  <p className='text-muted mx-auto' style={{ maxWidth: '700px' }}>
                    Expertly curated combinations of suits, shoes, and accessories for every occasion.
                  </p>
                </div>
                <Row>
                  {combinations.slice(0, 4).map((combo, index) => (
                    <Col lg={6} md={12} key={combo._id} className='mb-4'>
                      <Card className='combination-card h-100 shadow-sm'>
                        <Card.Body className='p-4'>
                          <div className='d-flex justify-content-between align-items-start mb-3'>
                            <div>
                              <h4 className='combination-title mb-2'>{combo.name}</h4>
                              <p className='text-muted mb-3'>{combo.description}</p>
                              <div className='combination-rating mb-3'>
                                {renderRatingStars(combo.rating)}
                                <small className='text-muted ms-2'>({combo.numReviews} reviews)</small>
                              </div>
                            </div>
                            <div className='text-end'>
                              <div className='combination-pricing'>
                                <div className='original-price text-muted text-decoration-line-through'>
                                  ${combo.totalPrice}
                                </div>
                                <div className='combo-price h4 text-primary mb-1'>
                                  ${combo.discountedPrice}
                                </div>
                                <Badge bg='success' className='savings-badge'>
                                  Save ${combo.savings}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <Row className='combination-items'>
                            <Col md={4} className='mb-3'>
                              <div className='combination-item text-center position-relative'>
                                <div className='item-image-wrapper mb-2 position-relative'>
                                  <img 
                                    src={getFullImageUrl(combo.suit.image)} 
                                    alt={combo.suit.name}
                                    className='item-image'
                                  />
                                  <div className='item-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'>
                                    <Button
                                      variant='light'
                                      size='sm'
                                      className='item-quick-view-btn'
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleQuickView(combo.suit);
                                      }}
                                      title="Quick View"
                                    >
                                      <FaEye />
                                    </Button>
                                  </div>
                                </div>
                                <h6 className='item-name'>{combo.suit.name}</h6>
                                <p className='item-price text-muted'>${combo.suit.price}</p>
                                <Badge bg='primary' className='item-category'>
                                  {combo.suit.category}
                                </Badge>
                              </div>
                            </Col>
                            <Col md={4} className='mb-3'>
                              <div className='combination-item text-center position-relative'>
                                <div className='item-image-wrapper mb-2 position-relative'>
                                  <img 
                                    src={getFullImageUrl(combo.shoes.image)} 
                                    alt={combo.shoes.name}
                                    className='item-image'
                                  />
                                  <div className='item-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'>
                                    <Button
                                      variant='light'
                                      size='sm'
                                      className='item-quick-view-btn'
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleQuickView(combo.shoes);
                                      }}
                                      title="Quick View"
                                    >
                                      <FaEye />
                                    </Button>
                                  </div>
                                </div>
                                <h6 className='item-name'>{combo.shoes.name}</h6>
                                <p className='item-price text-muted'>${combo.shoes.price}</p>
                                <Badge bg='secondary' className='item-category'>
                                  {combo.shoes.category}
                                </Badge>
                              </div>
                            </Col>
                            <Col md={4} className='mb-3'>
                              <div className='combination-item text-center position-relative'>
                                <div className='item-image-wrapper mb-2 position-relative'>
                                  <img 
                                    src={getFullImageUrl(combo.accessories.image)} 
                                    alt={combo.accessories.name}
                                    className='item-image'
                                  />
                                  <div className='item-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'>
                                    <Button
                                      variant='light'
                                      size='sm'
                                      className='item-quick-view-btn'
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleQuickView(combo.accessories);
                                      }}
                                      title="Quick View"
                                    >
                                      <FaEye />
                                    </Button>
                                  </div>
                                </div>
                                <h6 className='item-name'>{combo.accessories.name}</h6>
                                <p className='item-price text-muted'>${combo.accessories.price}</p>
                                <Badge bg='warning' className='item-category'>
                                  {combo.accessories.category}
                                </Badge>
                              </div>
                            </Col>
                          </Row>
                          
                          <div className='combination-actions mt-4'>
                            <Row>
                              <Col md={6} className='mb-2'>
                                <Button 
                                  variant='outline-primary' 
                                  className='w-100'
                                  onClick={() => handleViewCombinationDetails(combo)}
                                >
                                  View Details
                                </Button>
                              </Col>
                              <Col md={6} className='mb-2'>
                                <Button 
                                  variant='primary' 
                                  className='w-100'
                                  onClick={() => handleAddCompleteSet(combo)}
                                >
                                  Add Complete Set
                                </Button>
                              </Col>
                            </Row>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Container>
            </section>
          )}
           
           {/* Featured Products - Hugo Boss Inspired */}
          <section
            id='featuredProducts'
            className={`featured-products-hugo ${
              animatedElements.featuredProducts ? 'section-visible' : ''
            }`}
          >
            <Container fluid className="px-0">
              <div className='hugo-section-header'>
                <Container>
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <div className="hugo-title-block">
                        <span className="hugo-subtitle">SIGNATURE COLLECTION</span>
                        <h2 className="hugo-main-title">Signature Suits</h2>
                        <p className="hugo-description">
                        Handpicked premium suits that define elegance and sophistication for the modern gentleman.                        </p>
                      </div>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                      <div className="hugo-controls">
                        <div className="hugo-filter-bar">
                          <span className="hugo-filter-label">Sort by:</span>
                          <select 
                            className="hugo-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="featured">Featured</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                          </select>
                        </div>
                        <div className="hugo-product-count">
                          {data?.products ? `${Math.min(4, data.products.filter(p => p.category === 'Suits').length)} of ${data.products.filter(p => p.category === 'Suits').length} suits` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </div>

              <Container className="hugo-products-container">
              {isLoading ? (
                  <div className="hugo-loader text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading signature suits...</p>
                  </div>
              ) : error ? (
                  <div className="hugo-error text-center py-5">
                    <Alert variant="danger">
                      Error loading products. Please try again later.
                    </Alert>
                  </div>
              ) : (
                <>
                    <div className="hugo-products-grid-four">
                      {data?.products && data.products
                        .filter(product => product.category === 'Suits')
                        .sort((a, b) => {
                          switch (sortBy) {
                            case 'newest':
                              return new Date(b.createdAt) - new Date(a.createdAt);
                            case 'price-low':
                              const priceA = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceA - priceB;
                            case 'price-high':
                              const priceA2 = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB2 = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceB2 - priceA2;
                            case 'rating':
                              return (b.rating || 0) - (a.rating || 0);
                            case 'featured':
                            default:
                              // Featured products - prioritize by rating and reviews
                              const scoreA = (a.rating || 0) * (a.numReviews || 0);
                              const scoreB = (b.rating || 0) * (b.numReviews || 0);
                              return scoreB - scoreA;
                          }
                        })
                        .slice(0, 4)
                        .map((product, index) => (
                        <div 
                          key={product._id} 
                          className="hugo-product-item"
                          style={{ '--delay': `${index * 0.1}s` }}
                        >
                          <div className="hugo-product-card">
                            <div className="hugo-product-image-container">
                              <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                            src={getFullImageUrl(product.image)}
                            alt={product.name}
                                    className="hugo-product-image"
                            loading="lazy"
                          />
                                    <div className="hugo-image-overlay">
                                      <span className="hugo-view-text">View Product</span>
                                    </div>
                                  </div>
                        </Link>
                                
                              {/* Discount Badge */}
                              {product.salePrice && product.salePrice < product.price && (
                                <div className="hugo-discount-badge">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                              {/* Product Actions */}
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

                  <div className="hugo-view-all-section">
                    <Container>
                      <div className='hugo-view-all-content'>
                        <div className="hugo-view-all-text">
                          <h3>Explore Our Complete Suits Collection</h3>
                            <p>Discover the full range of premium suits designed for the modern gentleman</p>
                        </div>
                        <button
                          className='hugo-view-all-btn'
                            onClick={() => navigate('/category/suits')}
                        >
                          <span>View All Suits</span>
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
          {/* Special Offers */}
          <section
            id='specialOffers'
            className={`special-offers-section ${
              animatedElements.specialOffers ? 'section-visible' : ''
            }`}
          >
            <Container>
              <div className='section-title'>
                <h2>Special Offers</h2>
                <p>
                  Take advantage of these limited-time deals on our premium
                  collections.
                </p>
              </div>
              <Row>
                {specialOffers.map((offer, index) => (
                  <Col md={6} key={index}>
                    <div className='offer-card'>
                      <div className='offer-content'>
                        <h3 className='offer-title'>{offer.title}</h3>
                        <p className='offer-description'>{offer.description}</p>
                        <Button
                          className='offer-btn'
                          onClick={() => navigate(offer.link)}
                        >
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

          {/* Testimonials */}
          <section
            id='testimonials'
            className={`testimonials-section ${
              animatedElements.testimonials ? 'section-visible' : ''
            }`}
          >
            <Container>
              <div className='section-title'>
                <h2>Customer Testimonials</h2>
                <p>
                  Hear what our satisfied customers have to say about their
                  ProMayouf experience.
                </p>
              </div>
              <Row>
                {testimonials.map((testimonial, index) => (
                  <Col md={4} key={index}>
                    <div className='testimonial-card'>
                      <div className='testimonial-rating'>
                        {renderRatingStars(testimonial.rating)}
                      </div>
                      <p className='testimonial-content'>
                        "{testimonial.content}"
                      </p>
                      <h4 className='testimonial-author'>
                        {testimonial.author}
                      </h4>
                      <p className='testimonial-location'>
                        {testimonial.location}
                      </p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>





          {/* Premium Brand Section */}
          <section className="premium-brand-section">
            <Container>
              <div className="brand-statement">
                <h2>Crafted for the Modern Gentleman</h2>
                <p className="lead">
                  At ProMayouf, we believe that exceptional style begins with exceptional craftsmanship. 
                  Every piece in our collection is meticulously selected and designed to elevate your wardrobe 
                  with timeless elegance and contemporary sophistication.
                </p>
              </div>
              <div className="brand-pillars">
                <div className="brand-pillar fade-in-up">
                  <div className="pillar-icon">
                    <FaRuler />
                  </div>
                  <h3 className="pillar-title">Perfect Fit</h3>
                  <p className="pillar-description">
                    Our expert tailors ensure every garment fits you perfectly, 
                    with precision measurements and personalized adjustments.
                  </p>
                </div>
                <div className="brand-pillar fade-in-up" style={{'--delay': '0.2s'}}>
                  <div className="pillar-icon">
                    <FaStar />
                  </div>
                  <h3 className="pillar-title">Premium Quality</h3>
                  <p className="pillar-description">
                    We source only the finest materials from renowned mills, 
                    ensuring durability and luxury in every thread.
                  </p>
                </div>
                <div className="brand-pillar fade-in-up" style={{'--delay': '0.4s'}}>
                  <div className="pillar-icon">
                    <FaHeart />
                  </div>
                  <h3 className="pillar-title">Timeless Style</h3>
                  <p className="pillar-description">
                    Our designs transcend trends, offering classic elegance 
                    that remains relevant season after season.
                  </p>
                </div>
              </div>
            </Container>
          </section>

        

          {/* Chatbot toggle button that opens the chatbot */}
          <div
            className='position-fixed bottom-0 end-0 m-4'
            style={{ zIndex: 1200 }}
          >
            <SizeRecommenderChatbot
              onRecommendationComplete={handleSizeRecommendation}
              productType='General'
              open={chatbotOpen}
              setOpen={setChatbotOpen}
            />
            {!chatbotOpen && (
              <Button
                onClick={() => setChatbotOpen(true)}
                className='rounded-circle shadow-lg chatbot-toggle-btn'
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#003b5c',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                aria-label='Open Size Assistant Chatbot'
              >
                <div className='pulse-ring'></div>
                <FaRobot size={24} />
              </Button>
            )}
          </div>

          {/* Personal Style Consultant Chatbot */}
          <div
            className='position-fixed bottom-0 end-0 m-4'
            style={{ zIndex: 1200 }}
          >
            {!showUserInfoChatbot && (
              <Button
                onClick={handleUserInfoChatbotOpen}
                className='rounded-circle shadow-lg chatbot-toggle-btn'
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: '#007bff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                aria-label='Open Personal Style Consultant'
              >
                <div className='pulse-ring'></div>
                <FaRobot size={28} />
              </Button>
            )}
          </div>

          {/* User Info Chatbot Modal */}
          <UserInfoChatbot
            show={showUserInfoChatbot}
            onHide={handleUserInfoChatbotClose}
            onComplete={handleChatbotRecommendations}
          />

          {/* Scroll to top button - always accessible */}
          {scrollPosition > 300 && (
            <Button
              className='position-fixed scroll-to-top'
              style={{ zIndex: 1000, bottom: '20px', left: '20px' }}
              variant='dark'
              onClick={scrollToTop}
              aria-label='Scroll to top'
            >
              <FaArrowUp />
            </Button>
          )}

          {/* Category Product Showcases */}
          
          {/* Suits Collection */}
          <section
            id='suitsShowcase'
            className={`featured-products-hugo ${
              animatedElements.suitsShowcase ? 'section-visible' : ''
            }`}
          >
            <Container fluid className="px-0">
              <div className='hugo-section-header'>
                <Container>
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <div className="hugo-title-block">
                        <span className="hugo-subtitle">SUITS COLLECTION</span>
                        <h2 className="hugo-main-title">Premium Suits</h2>
                        <p className="hugo-description">
                          Discover our exquisite collection of premium suits, tailored for the modern gentleman who values elegance and sophistication.
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                      <div className="hugo-controls">
                        <div className="hugo-filter-bar">
                          <span className="hugo-filter-label">Sort by:</span>
                          <select 
                            className="hugo-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="featured">Featured</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                          </select>
                        </div>
                        <div className="hugo-product-count">
                          {data?.products ? `${Math.min(4, data.products.filter(p => p.category === 'Suits').length)} of ${data.products.filter(p => p.category === 'Suits').length} suits` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </div>

              <Container className="hugo-products-container">
              {isLoading ? (
                  <div className="hugo-loader text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading suits collection...</p>
                  </div>
              ) : error ? (
                  <div className="hugo-error text-center py-5">
                    <Alert variant="danger">
                      Error loading products. Please try again later.
                    </Alert>
                  </div>
              ) : (
                <>
                    <div className="hugo-products-grid-four">
                      {data?.products && data.products
                        .filter(product => product.category === 'Suits')
                        .sort((a, b) => {
                          switch (sortBy) {
                            case 'newest':
                              return new Date(b.createdAt) - new Date(a.createdAt);
                            case 'price-low':
                              const priceA = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceA - priceB;
                            case 'price-high':
                              const priceA2 = a.salePrice && a.salePrice < a.price ? a.salePrice : a.price;
                              const priceB2 = b.salePrice && b.salePrice < b.price ? b.salePrice : b.price;
                              return priceB2 - priceA2;
                            case 'rating':
                              return (b.rating || 0) - (a.rating || 0);
                            case 'featured':
                            default:
                              // Featured products - prioritize by rating and reviews
                              const scoreA = (a.rating || 0) * (a.numReviews || 0);
                              const scoreB = (b.rating || 0) * (b.numReviews || 0);
                              return scoreB - scoreA;
                          }
                        })
                        .slice(0, 4)
                        .map((product, index) => (
                        <div 
                          key={product._id} 
                          className="hugo-product-item"
                          style={{ '--delay': `${index * 0.1}s` }}
                        >
                          <div className="hugo-product-card">
                            <div className="hugo-product-image-container">
                              <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                                      src={getFullImageUrl(product.image)}
                                      alt={product.name}
                                    className="hugo-product-image"
                                    loading="lazy"
                                    />
                                    <div className="hugo-image-overlay">
                                      <span className="hugo-view-text">View Suit</span>
                                    </div>
                                  </div>
                                </Link>
                                
                              {/* Discount Badge */}
                              {product.salePrice && product.salePrice < product.price && (
                                <div className="hugo-discount-badge">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                              {/* Product Actions */}
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
                                  title="Quick View Suit"
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

                  <div className="hugo-view-all-section">
                    <Container>
                      <div className='hugo-view-all-content'>
                        <div className="hugo-view-all-text">
                          <h3>Explore Our Complete Suits Collection</h3>
                            <p>Discover the full range of premium suits designed for every occasion</p>
                        </div>
                        <button
                          className='hugo-view-all-btn'
                            onClick={() => navigate('/category/suits')}
                        >
                          <span>View All Suits</span>
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

          {/* Shoes Collection */}
          <section
            id='shoesShowcase'
            className={`featured-products-hugo ${
              animatedElements.shoesShowcase ? 'section-visible' : ''
            }`}
          >
            <Container fluid className="px-0">
              <div className='hugo-section-header'>
                <Container>
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <div className="hugo-title-block">
                        <span className="hugo-subtitle">SHOES COLLECTION</span>
                        <h2 className="hugo-main-title">Premium Footwear</h2>
                        <p className="hugo-description">
                          Step into elegance with our handcrafted shoes collection, featuring premium leather and timeless designs.
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                      <div className="hugo-controls">
                        <div className="hugo-product-count">
                          {data?.products ? `${data.products.filter(p => p.category === 'Shoes').length} shoes available` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </div>

              <Container className="hugo-products-container">
              {isLoading ? (
                  <div className="hugo-loader text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading shoes collection...</p>
                  </div>
              ) : error ? (
                  <div className="hugo-error text-center py-5">
                    <Alert variant="danger">
                      Error loading products. Please try again later.
                    </Alert>
                  </div>
              ) : (
                <>
                    <div className="hugo-products-grid">
                      {/* Shoes data */}
                      {(() => {
                        const shoes = data?.products ? data.products.filter(product => product.category === 'Shoes') : [];
                        const slicedShoes = shoes.slice(0, 4);
                        return slicedShoes.map((product, index) => (
                        <div 
                          key={product._id} 
                          className="hugo-product-item"
                          style={{ '--delay': `${index * 0.1}s` }}
                        >
                          <div className="hugo-product-card">
                            <div className="hugo-product-image-container">
                              <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                                      src={getFullImageUrl(product.image)}
                                      alt={product.name}
                                    className="hugo-product-image"
                                    loading="lazy"
                                    />
                                    <div className="hugo-image-overlay">
                                      <span className="hugo-view-text">View Shoes</span>
                                    </div>
                                  </div>
                                </Link>
                                
                              {/* Discount Badge */}
                              {product.salePrice && product.salePrice < product.price && (
                                <div className="hugo-discount-badge">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                              {/* Product Actions */}
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
                                  title="Quick View Shoes"
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
                        ))
                      })()}
                  </div>

                  <div className="hugo-view-all-section">
                    <Container>
                      <div className='hugo-view-all-content'>
                        <div className="hugo-view-all-text">
                          <h3>Explore Our Complete Shoes Collection</h3>
                            <p>Discover the full range of premium footwear for every style</p>
                        </div>
                        <button
                          className='hugo-view-all-btn'
                            onClick={() => navigate('/category/shoes')}
                        >
                          <span>View All Shoes</span>
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

          {/* Accessories Collection */}
          <section
            id='accessoriesShowcase'
            className={`featured-products-hugo ${
              animatedElements.accessoriesShowcase ? 'section-visible' : ''
            }`}
          >
            <Container fluid className="px-0">
              <div className='hugo-section-header'>
                <Container>
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <div className="hugo-title-block">
                        <span className="hugo-subtitle">ACCESSORIES COLLECTION</span>
                        <h2 className="hugo-main-title">Premium Accessories</h2>
                        <p className="hugo-description">
                          Complete your look with our curated selection of premium accessories, from ties to cufflinks and beyond.
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                      <div className="hugo-controls">
                        <div className="hugo-product-count">
                          {data?.products ? `${data.products.filter(p => p.category === 'Accessories').length} accessories available` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </div>

              <Container className="hugo-products-container">
              {isLoading ? (
                  <div className="hugo-loader text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading accessories collection...</p>
                  </div>
              ) : error ? (
                  <div className="hugo-error text-center py-5">
                    <Alert variant="danger">
                      Error loading products. Please try again later.
                    </Alert>
                  </div>
              ) : (
                <>
                    <div className="hugo-products-grid">
                      {/* Accessories data */}
                      {(() => {
                        const accessories = data?.products ? data.products.filter(product => product.category === 'Accessories') : [];
                        const slicedAccessories = accessories.slice(0, 4);
                        return slicedAccessories.map((product, index) => (
                        <div 
                          key={product._id} 
                          className="hugo-product-item"
                          style={{ '--delay': `${index * 0.1}s` }}
                        >
                          <div className="hugo-product-card">
                            <div className="hugo-product-image-container">
                              <Link to={`/product/${product._id}`} className="hugo-product-link">
                                  <div className="hugo-image-wrapper">
                                    <img
                                      src={getFullImageUrl(product.image)}
                                      alt={product.name}
                                    className="hugo-product-image"
                                    loading="lazy"
                                    />
                                    <div className="hugo-image-overlay">
                                      <span className="hugo-view-text">View Accessory</span>
                                    </div>
                                  </div>
                                </Link>
                                
                              {/* Discount Badge */}
                              {product.salePrice && product.salePrice < product.price && (
                                <div className="hugo-discount-badge">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                  </div>
                                )}

                              {/* Product Actions */}
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
                                  title="Quick View Accessory"
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
                        ))
                      })()}
                  </div>

                  <div className="hugo-view-all-section">
                    <Container>
                      <div className='hugo-view-all-content'>
                        <div className="hugo-view-all-text">
                          <h3>Explore Our Complete Accessories Collection</h3>
                            <p>Discover the full range of premium accessories to complete your look</p>
                        </div>
                        <button
                          className='hugo-view-all-btn'
                            onClick={() => navigate('/category/accessories')}
                        >
                          <span>View All Accessories</span>
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
        </>
      )}

      {/* Combination Details Modal */}
      <Modal 
        show={showCombinationModal} 
        onHide={closeCombinationModal} 
        size="xl" 
        className="combination-modal"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h4">
            {selectedCombination?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCombination && (
            <Container fluid>
              <Row className="align-items-center mb-4">
                <Col md={8}>
                  <h3 className="mb-3">{selectedCombination.name}</h3>
                  <p className="lead text-muted mb-3">{selectedCombination.description}</p>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rating-display">
                      {renderRatingStars(selectedCombination.rating)}
                      <span className="ms-2 text-muted">({selectedCombination.numReviews} reviews)</span>
                    </div>
                    <Badge bg="success" className="px-3 py-2">
                      Save ${selectedCombination.savings}
                    </Badge>
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  <div className="pricing-display">
                    <div className="text-muted text-decoration-line-through h6">
                      Original: ${selectedCombination.totalPrice}
                    </div>
                    <div className="h2 text-primary fw-bold">
                      ${selectedCombination.discountedPrice}
                    </div>
                  </div>
                </Col>
              </Row>

              <h4 className="mb-4 text-center">What's Included</h4>
              <Row className="g-4">
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Img 
                      variant="top" 
                      src={getFullImageUrl(selectedCombination.suit.image)} 
                      alt={selectedCombination.suit.name}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center">
                      <Badge bg="primary" className="mb-2">Suit</Badge>
                      <Card.Title className="h6">{selectedCombination.suit.name}</Card.Title>
                      <div className="h5 text-primary">${selectedCombination.suit.price}</div>
                      <div className="mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleQuickView(selectedCombination.suit)}
                        >
                          <FaEye className="me-1" /> Quick View
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Img 
                      variant="top" 
                      src={getFullImageUrl(selectedCombination.shoes.image)} 
                      alt={selectedCombination.shoes.name}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center">
                      <Badge bg="secondary" className="mb-2">Shoes</Badge>
                      <Card.Title className="h6">{selectedCombination.shoes.name}</Card.Title>
                      <div className="h5 text-primary">${selectedCombination.shoes.price}</div>
                      <div className="mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleQuickView(selectedCombination.shoes)}
                        >
                          <FaEye className="me-1" /> Quick View
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Img 
                      variant="top" 
                      src={getFullImageUrl(selectedCombination.accessories.image)} 
                      alt={selectedCombination.accessories.name}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center">
                      <Badge bg="warning" className="mb-2">Accessories</Badge>
                      <Card.Title className="h6">{selectedCombination.accessories.name}</Card.Title>
                      <div className="h5 text-primary">${selectedCombination.accessories.price}</div>
                      <div className="mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleQuickView(selectedCombination.accessories)}
                        >
                          <FaEye className="me-1" /> Quick View
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="w-100 d-flex justify-content-between align-items-center">
            <Button variant="outline-secondary" onClick={closeCombinationModal}>
              Close
            </Button>
            <div className="text-center">
              <div className="h5 mb-0 text-primary">
                Complete Set: ${selectedCombination?.discountedPrice}
              </div>
              <small className="text-muted">
                Save ${selectedCombination?.savings} when you buy the complete set
              </small>
            </div>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                if (selectedCombination) {
                  handleAddCompleteSet(selectedCombination);
                  closeCombinationModal();
                }
              }}
            >
              Add Complete Set
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          show={showQuickView}
          onHide={closeQuickView}
          onAddToCart={handleQuickViewAddToCart}
          quantity={quickViewQty}
          onQuantityChange={setQuickViewQty}
        />
      )}

    </>
  );
};

export default HomeScreen;
                        