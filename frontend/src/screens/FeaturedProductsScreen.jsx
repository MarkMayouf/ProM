import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Container,
  Card,
  Button,
  Badge,
  Tabs,
  Tab,
  Form,
  InputGroup,
  Breadcrumb,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaHeart,
  FaShoppingCart,
  FaEye,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFilter,
  FaSortAmountDown,
  FaArrowLeft,
  FaFire,
  FaTrophy,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { getFullImageUrl } from '../utils/imageUtils';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import MooresProductCard from '../components/MooresProductCard';
import { toast } from 'react-toastify';
import QuickViewModal from '../components/QuickViewModal';
import '../assets/styles/moores-style.css';

const FeaturedProductsScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const [activeTab, setActiveTab] = useState('most-sold');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Quick view state
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch all products
  const { data, isLoading, error } = useGetProductsQuery({
    keyword: '',
    pageNumber: 1,
    limit: 50, // Get more products for better filtering
  });

  // Process products based on active tab
  const getFilteredProducts = () => {
    if (!data?.products) return [];

    let filteredProducts = [...data.products];

    // Filter by search term
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category if selected
    if (categoryFilter !== 'all') {
      filteredProducts = filteredProducts.filter(
        product => product.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply tab-specific filtering
    switch (activeTab) {
      case 'most-sold':
        // Sort by number of reviews as proxy for sales
        filteredProducts.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
        break;
      case 'highest-rated':
        filteredProducts = filteredProducts.filter(product => (product.rating || 0) >= 4.0);
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'on-sale':
        filteredProducts = filteredProducts.filter(product => 
          (product.salePrice && product.salePrice < product.price) ||
          (product.regularPrice && product.regularPrice > product.price)
        );
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rating':
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return filteredProducts.slice(0, 24); // Limit to 24 products
  };

  const filteredProducts = getFilteredProducts();

  // Handle add to cart
  const handleAddToCart = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      navigate(`/product/${product._id}`);
      toast.info('Please select a size before adding to cart');
      return;
    }

    dispatch(addToCart({
      ...product,
      qty: 1,
      product: product._id,
    }));
    toast.success(`${product.name} added to cart!`);
  };

  // Handle wishlist toggle
  const handleToggleWishlist = (product) => {
    dispatch(toggleWishlistItem({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      brand: product.brand,
      category: product.category
    }));

    const isInWishlist = wishlistItems.some(item => item._id === product._id);
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Handle quick view
  const handleQuickView = (product) => {
    console.log('Quick view clicked for product:', product);
    setQuickViewProduct(product);
    setShowQuickView(true);
    console.log('showQuickView state set to:', true);
  };

  // Close quick view modal
  const closeQuickView = () => {
    setShowQuickView(false);
    setTimeout(() => {
      setQuickViewProduct(null);
    }, 300);
  };

  // Get tab display info
  const getTabInfo = (tab) => {
    switch (tab) {
      case 'most-sold':
        return { icon: <FaFire />, title: 'Best Sellers', description: 'Our most popular products' };
      case 'highest-rated':
        return { icon: <FaTrophy />, title: 'Top Rated', description: 'Highest customer ratings' };
      case 'newest':
        return { icon: <FaStar />, title: 'New Arrivals', description: 'Latest additions to our collection' };
      case 'on-sale':
        return { icon: <FaShoppingCart />, title: 'On Sale', description: 'Special offers and discounts' };
      default:
        return { icon: <FaStar />, title: 'Featured', description: 'Featured products' };
    }
  };

  const currentTabInfo = getTabInfo(activeTab);

  return (
    <div className="moores-category-container">
      <Meta title="Featured Products | ProMayouf" />
      
      {/* Header */}
      <div className="moores-category-header">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="moores-breadcrumb">
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item active>Featured Products</Breadcrumb.Item>
          </Breadcrumb>

          {/* Title */}
          <h1 className="moores-category-title">
            {currentTabInfo.icon} {currentTabInfo.title}
          </h1>
          <p className="moores-category-subtitle">
            {currentTabInfo.description}
          </p>
        </Container>
      </div>

      {/* Filters and Tabs */}
      <div className="moores-filters-section">
        <Container>
          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="d-flex flex-wrap gap-2">
              {[
                { key: 'most-sold', label: 'Best Sellers' },
                { key: 'highest-rated', label: 'Top Rated' },
                { key: 'newest', label: 'New Arrivals' },
                { key: 'on-sale', label: 'On Sale' },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'dark' : 'outline-dark'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="moores-filters-container">
            <div>
              <p className="moores-results-count">
                {isLoading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
            </div>
            
            <div className="d-flex gap-3 align-items-center">
              {/* Category Filter */}
              <select
                className="moores-sort-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="all">All Categories</option>
                <option value="suits">Suits</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>

              {/* Sort */}
              <div className="moores-sort-container">
                <p className="moores-sort-label">Sort by:</p>
                <select
                  className="moores-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="rating">Best Rated</option>
                </select>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Products Grid */}
      <Container>
        {isLoading ? (
          <div className="moores-loading-container">
            <div className="moores-loading-spinner"></div>
          </div>
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="moores-empty-state">
                <h2 className="moores-empty-title">No products found</h2>
                <p className="moores-empty-description">
                  Try adjusting your filters or browse our other categories.
                </p>
                <Button variant="dark" onClick={() => navigate('/')}>
                  Browse All Products
                </Button>
              </div>
            ) : (
              <div className="moores-products-grid">
                {filteredProducts.map((product) => (
                  <MooresProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    onQuickView={handleQuickView}
                    isInWishlist={wishlistItems.some(item => item._id === product._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Container>
      
      {/* Quick View Modal */}
      <QuickViewModal
        show={showQuickView}
        onHide={closeQuickView}
        product={quickViewProduct}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />
    </div>
  );
};

export default FeaturedProductsScreen; 