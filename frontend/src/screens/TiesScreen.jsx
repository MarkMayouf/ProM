import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Container, Button, Form, InputGroup, Badge, Carousel, Tabs, Tab } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaAngleRight,
  FaEye,
  FaSortAmountDown,
  FaArrowLeft,
  FaCheck
} from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';

const TiesScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // State for filters and sorting
  const [pattern, setPattern] = useState('');
  const [color, setColor] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch ties products from API
  const { data, isLoading, error } = useGetProductsQuery({
    category: 'accessories',
    subcategory: 'ties',
    pageNumber: 1
  });

  // Patterns available for ties
  const patterns = [
    { id: 'solid', name: 'Solid' },
    { id: 'striped', name: 'Striped' },
    { id: 'checked', name: 'Checked' },
    { id: 'paisley', name: 'Paisley' },
    { id: 'polka-dot', name: 'Polka Dot' },
    { id: 'floral', name: 'Floral' }
  ];

  // Colors available for ties
  const colors = [
    { id: 'blue', name: 'Blue', hex: '#0056b3' },
    { id: 'red', name: 'Red', hex: '#dc3545' },
    { id: 'black', name: 'Black', hex: '#000000' },
    { id: 'navy', name: 'Navy', hex: '#001f3f' },
    { id: 'burgundy', name: 'Burgundy', hex: '#800020' },
    { id: 'green', name: 'Green', hex: '#28a745' },
    { id: 'purple', name: 'Purple', hex: '#6f42c1' },
    { id: 'grey', name: 'Grey', hex: '#6c757d' }
  ];

  // Price ranges
  const priceRanges = [
    { id: 'under-50', name: 'Under $50', min: 0, max: 50 },
    { id: '50-100', name: '$50 - $100', min: 50, max: 100 },
    { id: '100-200', name: '$100 - $200', min: 100, max: 200 },
    { id: 'over-200', name: 'Over $200', min: 200, max: Number.MAX_SAFE_INTEGER }
  ];

  // Featured tie collections
  const tieCollections = [
    {
      id: 'silk-collection',
      name: 'Premium Silk Collection',
      description: 'Our finest Italian silk ties, perfect for formal occasions',
      image: '/images/collections/silk-ties.jpg'
    },
    {
      id: 'patterned-collection',
      name: 'Patterned Ties',
      description: 'Bold patterns to make a statement with any outfit',
      image: '/images/collections/patterned-ties.jpg'
    },
    {
      id: 'bow-ties',
      name: 'Bow Ties',
      description: 'Classic and modern bow ties for formal events',
      image: '/images/collections/bow-ties.jpg'
    }
  ];

  // Styling guide
  const stylingTips = [
    {
      title: 'Classic Pairing',
      description: 'Pair a solid navy tie with a light blue shirt and navy suit for a timeless look',
      image: '/images/styling/classic-pairing.jpg'
    },
    {
      title: 'Business Meeting',
      description: 'For important meetings, choose a burgundy or deep red tie with subtle patterns',
      image: '/images/styling/business-meeting.jpg'
    },
    {
      title: 'Casual Friday',
      description: 'Try a knitted tie with a button-down collar shirt for a smart-casual look',
      image: '/images/styling/casual-friday.jpg'
    }
  ];

  // Apply filters and sorting to products
  useEffect(() => {
    if (data && data.products) {
      let filtered = [...data.products];

      // Apply pattern filter
      if (pattern) {
        filtered = filtered.filter(product =>
          product.details && product.details.pattern &&
          product.details.pattern.toLowerCase() === pattern.toLowerCase()
        );
      }

      // Apply color filter
      if (color) {
        filtered = filtered.filter(product =>
          product.details && product.details.color &&
          product.details.color.toLowerCase() === color.toLowerCase()
        );
      }

      // Apply price range filter
      if (priceRange) {
        const range = priceRanges.find(range => range.id === priceRange);
        if (range) {
          filtered = filtered.filter(product =>
            product.price >= range.min && product.price <= range.max
          );
        }
      }

      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price-low-high':
            filtered.sort((a, b) => a.price - b.price);
            break;
          case 'price-high-low':
            filtered.sort((a, b) => b.price - a.price);
            break;
          case 'name-a-z':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'popularity':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          default: // newest
            // No sorting needed as API should return newest first
            break;
        }
      }

      setFilteredProducts(filtered);
    }
  }, [data, pattern, color, priceRange, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setPattern('');
    setColor('');
    setPriceRange('');
    setSortBy('newest');
  };

  // Add to cart handler
  const handleAddToCart = (product) => {
    dispatch(addToCart({
      ...product,
      qty: 1,
    }));
    toast.success(`${product.name} added to cart!`);
  };

  // Wishlist toggle handler
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
    toast.success(isInWishlist ?
      `${product.name} removed from wishlist` :
      `${product.name} added to wishlist`
    );
  };

  // View product details handler
  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <>
      <Helmet>
        <title>Premium Ties Collection | ProMayouf</title>
        <meta name="description" content="Explore our exclusive collection of handcrafted ties made from the finest silks and materials." />
      </Helmet>

      {/* Hero Banner */}
      <div className="ties-hero-banner">
        <Container>
          <div className="ties-hero-content">
            <h1>Premium Ties Collection</h1>
            <p>Elevate your style with our handcrafted ties made from the finest materials</p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => document.getElementById('ties-collection').scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Collection
            </Button>
          </div>
        </Container>
      </div>

      <Container className="my-5">
        {/* Breadcrumb navigation */}
        <div className="ties-breadcrumb mb-4">
          <Link to="/">Home</Link> /
          <Link to="/category/accessories"> Accessories</Link> /
          <Link to={{ pathname: "/category/accessories", search: "?subcategory=ties" }}> Ties</Link>
        </div>

        {/* Tie Collections Showcase */}
        <section className="mb-5">
          <h2 className="section-title mb-4">Our Tie Collections</h2>
          <Row>
            {tieCollections.map(collection => (
              <Col md={4} key={collection.id} className="mb-4">
                <Card className="collection-card h-100 border-0 shadow-sm">
                  <div className="collection-image-container">
                    <Card.Img variant="top" src={collection.image} alt={collection.name} className="collection-image" />
                    <div className="collection-overlay">
                      <Button variant="light" onClick={() => navigate(`/search/${collection.id}`)}>
                        Explore Collection
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title className="collection-title">{collection.name}</Card.Title>
                    <Card.Text className="collection-description">{collection.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Filter and Products Section */}
        <section id="ties-collection" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">All Ties</h2>
            <Button
              variant="outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="d-flex align-items-center"
            >
              <FaFilter className="me-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="filter-card mb-4 border-0 shadow-sm">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Pattern</Form.Label>
                      <Form.Select
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                      >
                        <option value="">All Patterns</option>
                        {patterns.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Color</Form.Label>
                      <Form.Select
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      >
                        <option value="">All Colors</option>
                        {colors.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Price Range</Form.Label>
                      <Form.Select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                      >
                        <option value="">All Prices</option>
                        {priceRanges.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Sort By</Form.Label>
                      <Form.Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="newest">Newest</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                        <option value="name-a-z">Name: A to Z</option>
                        <option value="popularity">Popularity</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="me-2"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Color chips filter */}
          <div className="color-filter-chips mb-4">
            <div className="d-flex align-items-center">
              <span className="me-3 text-muted">Quick filter by color:</span>
              <div className="color-chips">
                <Button
                  variant={color === '' ? 'secondary' : 'light'}
                  size="sm"
                  className="me-2 chip"
                  onClick={() => setColor('')}
                >
                  All
                </Button>
                {colors.map(c => (
                  <Button
                    key={c.id}
                    className={`color-chip me-2 ${color === c.id ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.id)}
                    title={c.name}
                  >
                    {color === c.id && <FaCheck color="white" />}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Message variant="danger">
              {error?.data?.message || error.error || 'Error loading products'}
            </Message>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <h3>No ties found matching your filters</h3>
                  <p className="text-muted">Try adjusting your filter criteria</p>
                  <Button variant="primary" onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4">Showing {filteredProducts.length} ties</p>
                  <Row className="g-4">
                    {filteredProducts.map(product => (
                      <Col key={product._id} sm={6} md={4} lg={3}>
                        <Card className="product-card h-100 border-0 shadow-sm">
                          <div className="product-image-container">
                            <Card.Img
                              variant="top"
                              src={product.image}
                              alt={product.name}
                              className="product-image"
                              onClick={() => handleViewDetails(product._id)}
                            />
                            {product.sale && (
                              <Badge bg="danger" className="product-badge sale-badge">Sale</Badge>
                            )}
                            {product.new && (
                              <Badge bg="primary" className="product-badge new-badge">New</Badge>
                            )}
                            <div className="product-actions">
                              <Button
                                variant="light"
                                className="action-btn"
                                onClick={() => handleAddToCart(product)}
                                title="Add to Cart"
                              >
                                <FaShoppingCart />
                              </Button>
                              <Button
                                variant="light"
                                className={`action-btn ${wishlistItems.some(item => item._id === product._id) ? 'text-danger' : ''}`}
                                onClick={() => handleToggleWishlist(product)}
                                title={wishlistItems.some(item => item._id === product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                              >
                                {wishlistItems.some(item => item._id === product._id) ? (
                                  <FaHeart />
                                ) : (
                                  <FaRegHeart />
                                )}
                              </Button>
                              <Button
                                variant="light"
                                className="action-btn"
                                onClick={() => handleViewDetails(product._id)}
                                title="View Details"
                              >
                                <FaEye />
                              </Button>
                            </div>
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <Card.Title className="product-title">{product.name}</Card.Title>
                            <div className="product-meta">
                              {product.details?.pattern && (
                                <span className="product-pattern me-2">{product.details.pattern}</span>
                              )}
                              {product.details?.material && (
                                <span className="product-material">{product.details.material}</span>
                              )}
                            </div>
                            <div className="product-price mt-auto">
                              ${product.price.toFixed(2)}
                              {product.regularPrice > product.price && (
                                <span className="regular-price ms-2">${product.regularPrice.toFixed(2)}</span>
                              )}
                            </div>
                            <Button
                              variant="primary"
                              className="mt-3 w-100"
                              onClick={() => handleAddToCart(product)}
                            >
                              Add to Cart
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </>
          )}
        </section>

        {/* Styling Guide */}
        <section className="mb-5">
          <h2 className="section-title mb-4">How to Style Your Tie</h2>
          <Tabs
            defaultActiveKey="classic"
            id="styling-guide-tabs"
            className="mb-4 styling-tabs"
          >
            <Tab eventKey="classic" title="Classic Style">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/classic-style.jpg" alt="Classic Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Classic Elegance</h3>
                  <p>The classic style features a solid or subtly patterned tie with a width between 3-3.5 inches. This timeless look pairs perfectly with business suits and formal attire.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Navy or burgundy tie with light blue shirt and navy suit</li>
                    <li>Burgundy tie with white shirt and charcoal suit</li>
                    <li>Subtle striped tie with solid shirt for a sophisticated look</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/classic-ties')}>
                    Shop Classic Ties
                  </Button>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="modern" title="Modern Look">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/modern-style.jpg" alt="Modern Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Contemporary Style</h3>
                  <p>The modern approach features slimmer ties (2-2.75 inches) with bold patterns or colors. Perfect for creating a fashion-forward look while maintaining professionalism.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Slim knit tie with button-down collar shirt</li>
                    <li>Bold patterned tie with solid shirt for a statement look</li>
                    <li>Textured tie with a fitted suit for modern sophistication</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/modern-ties')}>
                    Shop Modern Ties
                  </Button>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="casual" title="Business Casual">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/casual-style.jpg" alt="Business Casual Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Business Casual</h3>
                  <p>Business casual styling combines comfort with professionalism. Think knitted ties, more relaxed patterns, and creative color combinations for a smart-casual balance.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Knitted tie with an Oxford button-down and blazer</li>
                    <li>Patterned tie with a casual blazer and chinos</li>
                    <li>Seasonal fabric ties (wool for winter, linen for summer)</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/casual-ties')}>
                    Shop Business Casual Ties
                  </Button>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </section>
      </Container>

      {/* CSS for this component */}
      <style jsx="true">{`
        .ties-hero-banner {
          background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/ties-hero.jpg');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 100px 0;
          margin-bottom: 40px;
        }

        .ties-hero-content {
          max-width: 600px;
        }

        .ties-hero-content h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .ties-hero-content p {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .ties-breadcrumb {
          font-size: 14px;
          color: #6c757d;
        }

        .ties-breadcrumb a {
          color: #003b5c;
          text-decoration: none;
          margin: 0 5px;
        }

        .ties-breadcrumb a:first-child {
          margin-left: 0;
        }

        .ties-breadcrumb span {
          margin-left: 5px;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #1a2c42;
          position: relative;
          padding-bottom: 10px;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background-color: #003b5c;
        }

        .collection-card {
          transition: all 0.3s ease;
          border-radius: 8px;
          overflow: hidden;
        }

        .collection-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }

        .collection-image-container {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .collection-image {
          height: 100%;
          width: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .collection-card:hover .collection-image {
          transform: scale(1.1);
        }

        .collection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .collection-card:hover .collection-overlay {
          opacity: 1;
        }

        .collection-title {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 10px;
          color: #1a2c42;
        }

        .collection-description {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .filter-card {
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .color-filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .color-chip {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .color-chip:hover {
          transform: scale(1.1);
        }

        .color-chip.active {
          transform: scale(1.1);
          box-shadow: 0 0 0 2px white, 0 0 0 4px #003b5c;
        }

        .chip {
          border-radius: 20px;
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
        }

        .product-card {
          transition: all 0.3s ease;
          border-radius: 8px;
          overflow: hidden;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }

        .product-image-container {
          position: relative;
          overflow: hidden;
          height: 220px;
        }

        .product-image {
          height: 100%;
          width: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
          cursor: pointer;
        }

        .product-card:hover .product-image {
          transform: scale(1.1);
        }

        .product-badge {
          position: absolute;
          top: 10px;
          z-index: 1;
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
        }

        .sale-badge {
          left: 10px;
        }

        .new-badge {
          right: 10px;
        }

        .product-actions {
          position: absolute;
          bottom: -50px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 10px;
          background: rgba(255,255,255,0.9);
          transition: bottom 0.3s ease;
        }

        .product-card:hover .product-actions {
          bottom: 0;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background-color: #003b5c;
          color: white;
        }

        .product-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1a2c42;
        }

        .product-meta {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 10px;
        }

        .product-price {
          font-size: 1.2rem;
          font-weight: 700;
          color: #003b5c;
        }

        .regular-price {
          font-size: 0.9rem;
          text-decoration: line-through;
          color: #6c757d;
          font-weight: normal;
        }

        .styling-tabs .nav-link {
          color: #495057;
          border: none;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .styling-tabs .nav-link.active {
          color: #003b5c;
          background: none;
          border-bottom: 3px solid #003b5c;
        }

        .styling-tips {
          list-style: none;
          padding-left: 0;
        }

        .styling-tips li {
          padding: 8px 0 8px 24px;
          position: relative;
        }

        .styling-tips li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #003b5c;
          font-size: 20px;
        }

        @media (max-width: 768px) {
          .ties-hero-banner {
            padding: 60px 0;
          }

          .ties-hero-content h1 {
            font-size: 2.2rem;
          }

          .section-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </>
  );
};

export default TiesScreen;