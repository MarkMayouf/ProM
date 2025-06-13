import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Container, Button, Alert, Badge, Form, Breadcrumb } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaAngleRight, FaArrowLeft, FaShoppingBag, FaTag, FaCheck, FaFilter, FaSort, FaShoppingCart, FaHeart, FaRegHeart, FaEye, FaTimes, FaTshirt } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import Product from '../components/Product';
import UniversalProductCard from '../components/UniversalProductCard';
import MooresProductCard from '../components/MooresProductCard';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { toast } from 'react-toastify';
import Meta from '../components/Meta';
import '../assets/styles/category.css';
import '../assets/styles/moores-style.css';
import Rating from '../components/Rating';
import QuickViewModal from '../components/QuickViewModal';
import { useScrollToTop } from '../hooks/useScrollToTop';

const CategoryScreen = () => {
  const { category, pageNumber = 1 } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // Scroll to top when component mounts or category changes
  useScrollToTop({ onMount: true });

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const selectedSubcategory = queryParams.get('subcategory') || '';
  const sortBy = queryParams.get('sort') || 'newest';
  const minPrice = queryParams.get('minPrice') || '';
  const maxPrice = queryParams.get('maxPrice') || '';

  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  
  // Quick view state
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch products with filters - Fix the category parameter mapping
  const getCategoryForAPI = (urlCategory) => {
    const categoryMapping = {
      'suits': 'Suits',
      'shoes': 'Shoes', 
      'accessories': 'Accessories',
      'tuxedos': 'Tuxedos',
      'blazers': 'Blazers',
      'dress-shirts': 'Dress Shirts'
    };
    return categoryMapping[urlCategory?.toLowerCase()] || urlCategory;
  };

  // Build query parameters based on category
  const buildQueryParams = () => {
    const params = {
      keyword: '',
      pageNumber,
      subcategory: selectedSubcategory,
      sort: sortBy,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    };

    // Handle special "sale" category
    if (category?.toLowerCase() === 'sale') {
      params.sale = 'true';
    } else {
      params.category = getCategoryForAPI(category);
    }

    return params;
  };

  const { data, isLoading, error } = useGetProductsQuery(buildQueryParams());

  // Update local sort when URL changes
  useEffect(() => {
    setLocalSortBy(sortBy);
  }, [sortBy]);

  // Handle add to cart
  const addToCartHandler = (product) => {
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

  // Handle sort change
  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(location.search);
    params.set('sort', newSort);
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };

  // Category data - Fix category matching
  const categoryData = {
    suits: {
      title: 'Suits',
      description: 'Discover our premium collection of suits designed for the modern gentleman.',
      subcategories: [
        { name: 'Business Suits', value: 'business' },
        { name: 'Wedding Suits', value: 'wedding' },
        { name: 'Formal Suits', value: 'formal' },
        { name: 'Casual Suits', value: 'casual' },
      ]
    },
    shoes: {
      title: 'Shoes',
      description: 'Step out in style with our collection of premium footwear.',
      subcategories: [
        { name: 'Oxford Shoes', value: 'oxford' },
        { name: 'Derby Shoes', value: 'derby' },
        { name: 'Loafers', value: 'loafers' },
        { name: 'Boots', value: 'boots' },
      ]
    },
    accessories: {
      title: 'Accessories',
      description: 'Complete your look with our premium accessories collection.',
      subcategories: [
        { name: 'Ties & Bow Ties', value: 'ties' },
        { name: 'Belts', value: 'belts' },
        { name: 'Cufflinks', value: 'cufflinks' },
        { name: 'Pocket Squares', value: 'pocket-squares' },
      ]
    }
  };

  // Fix category matching to be case-insensitive
  const currentCategory = categoryData[category?.toLowerCase()] || {
    title: category?.charAt(0).toUpperCase() + category?.slice(1) || 'Products',
    description: 'Discover our premium collection.',
    subcategories: []
  };

  return (
    <div className="moores-category-container">
      <Meta title={`${currentCategory.title} | ProMayouf`} />
      
      {/* Category Header */}
      <div className="moores-category-header">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="moores-breadcrumb">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
              {currentCategory.title}
            </Breadcrumb.Item>
            {selectedSubcategory && (
              <Breadcrumb.Item active>
                {currentCategory.subcategories.find(sub => sub.value === selectedSubcategory)?.name || selectedSubcategory}
              </Breadcrumb.Item>
            )}
          </Breadcrumb>

          {/* Category Title */}
          <h1 className="moores-category-title">
            {currentCategory.title}
            {selectedSubcategory && (
              <span> - {currentCategory.subcategories.find(sub => sub.value === selectedSubcategory)?.name || selectedSubcategory}</span>
            )}
          </h1>
          <p className="moores-category-subtitle">
            {currentCategory.description}
          </p>
        </Container>
      </div>

      {/* Filters and Sorting */}
      <div className="moores-filters-section">
        <Container>
          <div className="moores-filters-container">
            <div>
              <p className="moores-results-count">
                {isLoading ? 'Loading...' : `${data?.products?.length || 0} products found`}
              </p>
            </div>
            
            <div className="moores-sort-container">
              <p className="moores-sort-label">Sort by:</p>
              <select
                className="moores-sort-select"
                value={localSortBy}
                onChange={(e) => {
                  setLocalSortBy(e.target.value);
                  handleSortChange(e.target.value);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="rating">Best Rated</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container>
        {/* Subcategory Filters */}
        {currentCategory.subcategories.length > 0 && (
          <div className="mb-4">
            <div className="d-flex flex-wrap gap-2">
              <Button
                variant={!selectedSubcategory ? 'dark' : 'outline-dark'}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  params.delete('subcategory');
                  navigate({
                    pathname: location.pathname,
                    search: params.toString()
                  });
                }}
              >
                All {currentCategory.title}
              </Button>
              {currentCategory.subcategories.map((subcategory) => (
                <Button
                  key={subcategory.value}
                  variant={selectedSubcategory === subcategory.value ? 'dark' : 'outline-dark'}
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(location.search);
                    params.set('subcategory', subcategory.value);
                    navigate({
                      pathname: location.pathname,
                      search: params.toString()
                    });
                  }}
                >
                  {subcategory.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
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
            {data.products.length === 0 ? (
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
              <>
                <div className="moores-products-grid">
                  {data.products.map((product) => (
                    <MooresProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={addToCartHandler}
                      onToggleWishlist={handleToggleWishlist}
                      onQuickView={handleQuickView}
                      isInWishlist={wishlistItems.some(item => item._id === product._id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <Paginate
                      pages={data.pages}
                      page={data.page}
                      category={category}
                      subcategory={selectedSubcategory}
                      sort={sortBy}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
      
      {/* Quick View Modal */}
      <QuickViewModal
        show={showQuickView}
        onHide={closeQuickView}
        product={quickViewProduct}
        onAddToCart={addToCartHandler}
        onToggleWishlist={handleToggleWishlist}
      />
    </div>
  );
};

export default CategoryScreen;
