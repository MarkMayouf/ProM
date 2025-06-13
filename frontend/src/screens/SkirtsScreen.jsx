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

const SkirtsScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // State for filters and sorting
  const [style, setStyle] = useState('');
  const [color, setColor] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch skirts products from API
  const { data, isLoading, error } = useGetProductsQuery({
    category: 'clothing',
    subcategory: 'skirts',
    pageNumber: 1
  });

  // Styles available for skirts
  const styles = [
    { id: 'pencil', name: 'Pencil' },
    { id: 'a-line', name: 'A-Line' },
    { id: 'pleated', name: 'Pleated' },
    { id: 'wrap', name: 'Wrap' },
    { id: 'mini', name: 'Mini' },
    { id: 'midi', name: 'Midi' },
    { id: 'maxi', name: 'Maxi' }
  ];

  // Colors available for skirts
  const colors = [
    { id: 'black', name: 'Black', hex: '#000000' },
    { id: 'navy', name: 'Navy', hex: '#001f3f' },
    { id: 'grey', name: 'Grey', hex: '#6c757d' },
    { id: 'white', name: 'White', hex: '#ffffff' },
    { id: 'blue', name: 'Blue', hex: '#0056b3' },
    { id: 'red', name: 'Red', hex: '#dc3545' },
    { id: 'beige', name: 'Beige', hex: '#f5f5dc' },
    { id: 'burgundy', name: 'Burgundy', hex: '#800020' }
  ];

  // Price ranges
  const priceRanges = [
    { id: 'under-100', name: 'Under $100', min: 0, max: 100 },
    { id: '100-200', name: '$100 - $200', min: 100, max: 200 },
    { id: '200-300', name: '$200 - $300', min: 200, max: 300 },
    { id: 'over-300', name: 'Over $300', min: 300, max: Number.MAX_SAFE_INTEGER }
  ];

  // Featured skirt collections
  const skirtCollections = [
    {
      id: 'business-collection',
      name: 'Business Professional',
      description: 'Elegant pencil and A-line skirts perfect for office wear',
      image: '/images/collections/business-skirts.jpg'
    },
    {
      id: 'casual-collection',
      name: 'Casual Elegance',
      description: 'Comfortable yet stylish skirts for everyday wear',
      image: '/images/collections/casual-skirts.jpg'
    },
    {
      id: 'formal-collection',
      name: 'Formal & Evening',
      description: 'Sophisticated skirts for special occasions and events',
      image: '/images/collections/formal-skirts.jpg'
    }
  ];

  // Styling guide
  const stylingTips = [
    {
      title: 'Professional Look',
      description: 'Pair a pencil skirt with a crisp blouse and blazer for a commanding business presence',
      image: '/images/styling/professional-skirt.jpg'
    },
    {
      title: 'Casual Chic',
      description: 'Style an A-line skirt with a tucked-in sweater and ankle boots for effortless elegance',
      image: '/images/styling/casual-skirt.jpg'
    },
    {
      title: 'Evening Elegance',
      description: 'Choose a midi or maxi skirt with a silk top for sophisticated evening wear',
      image: '/images/styling/evening-skirt.jpg'
    }
  ];

  // Apply filters and sorting to products
  useEffect(() => {
    if (data && data.products) {
      let filtered = [...data.products];

      // Apply style filter
      if (style) {
        filtered = filtered.filter(product =>
          product.details && product.details.style &&
          product.details.style.toLowerCase() === style.toLowerCase()
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
  }, [data, style, color, priceRange, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setStyle('');
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
        <title>Premium Skirts Collection | ProMayouf</title>
        <meta name="description" content="Explore our exclusive collection of elegant skirts crafted for the modern professional woman." />
      </Helmet>

      {/* Hero Banner */}
      <div className="skirts-hero-banner">
        <Container>
          <div className="skirts-hero-content">
            <h1>Premium Skirts Collection</h1>
            <p>Elevate your professional wardrobe with our elegant skirts designed for the modern woman</p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => document.getElementById('skirts-collection').scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Collection
            </Button>
          </div>
        </Container>
      </div>

      <Container className="my-5">
        {/* Breadcrumb navigation */}
        <div className="skirts-breadcrumb mb-4">
          <Link to="/">Home</Link> /
          <Link to="/category/clothing"> Clothing</Link> /
          <Link to={{ pathname: "/category/clothing", search: "?subcategory=skirts" }}> Skirts</Link>
        </div>

        {/* Skirt Collections Showcase */}
        <section className="mb-5">
          <h2 className="section-title mb-4">Our Skirt Collections</h2>
          <Row>
            {skirtCollections.map(collection => (
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
        <section id="skirts-collection" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">All Skirts</h2>
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
                      <Form.Label className="fw-bold">Style</Form.Label>
                      <Form.Select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        <option value="">All Styles</option>
                        {styles.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
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
                    style={{ backgroundColor: c.hex, border: c.id === 'white' ? '1px solid #ddd' : 'none' }}
                    onClick={() => setColor(c.id)}
                    title={c.name}
                  >
                    {color === c.id && <FaCheck color={c.id === 'white' ? 'black' : 'white'} />}
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
                  <h3>No skirts found matching your filters</h3>
                  <p className="text-muted">Try adjusting your filter criteria</p>
                  <Button variant="primary" onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4">Showing {filteredProducts.length} skirts</p>
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
                              {product.details?.style && (
                                <span className="product-style me-2">{product.details.style}</span>
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
          <h2 className="section-title mb-4">How to Style Your Skirt</h2>
          <Tabs
            defaultActiveKey="professional"
            id="styling-guide-tabs"
            className="mb-4 styling-tabs"
          >
            <Tab eventKey="professional" title="Professional Style">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/professional-style.jpg" alt="Professional Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Professional Elegance</h3>
                  <p>The professional style features tailored pencil or A-line skirts paired with crisp blouses and blazers. This timeless look is perfect for business meetings and corporate environments.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Navy pencil skirt with white blouse and matching blazer</li>
                    <li>Black A-line skirt with silk blouse for boardroom meetings</li>
                    <li>Grey skirt with subtle patterns for sophisticated office wear</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/professional-skirts')}>
                    Shop Professional Skirts
                  </Button>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="casual" title="Casual Chic">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/casual-style.jpg" alt="Casual Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Effortless Elegance</h3>
                  <p>Casual styling combines comfort with sophistication. Think A-line and wrap skirts with knit tops, sweaters, and comfortable footwear for a relaxed yet polished appearance.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Flowy A-line skirt with tucked-in sweater and ankle boots</li>
                    <li>Wrap skirt with casual blouse for weekend brunches</li>
                    <li>Midi skirt with sneakers for contemporary casual looks</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/casual-skirts')}>
                    Shop Casual Skirts
                  </Button>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="evening" title="Evening Wear">
              <Row className="align-items-center">
                <Col md={6}>
                  <img src="/images/styling/evening-style.jpg" alt="Evening Style" className="img-fluid rounded" />
                </Col>
                <Col md={6}>
                  <h3 className="mb-3">Evening Sophistication</h3>
                  <p>Evening styling emphasizes elegance and glamour. Choose midi or maxi skirts in luxurious fabrics paired with silk tops, heels, and statement accessories for special occasions.</p>
                  <h4 className="mt-4 mb-3">Perfect Pairings:</h4>
                  <ul className="styling-tips">
                    <li>Silk midi skirt with delicate blouse for dinner dates</li>
                    <li>Pleated maxi skirt with fitted top for formal events</li>
                    <li>Sequined or textured skirts for cocktail parties</li>
                  </ul>
                  <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/search/evening-skirts')}>
                    Shop Evening Skirts
                  </Button>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </section>
      </Container>

      {/* CSS for this component */}
      <style jsx="true">{`
        .skirts-hero-banner {
          background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/skirts-hero.jpg');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 100px 0;
          margin-bottom: 40px;
        }

        .skirts-hero-content {
          max-width: 600px;
        }

        .skirts-hero-content h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .skirts-hero-content p {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .skirts-breadcrumb {
          font-size: 14px;
          color: #6c757d;
        }

        .skirts-breadcrumb a {
          color: #003b5c;
          text-decoration: none;
          margin: 0 5px;
        }

        .skirts-breadcrumb a:first-child {
          margin-left: 0;
        }

        .skirts-breadcrumb span {
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
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .collection-card:hover .collection-image {
          transform: scale(1.05);
        }

        .collection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
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
          color: #1a2c42;
          margin-bottom: 0.75rem;
        }

        .collection-description {
          color: #6c757d;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .filter-card {
          background: #f8f9fa;
          border-radius: 12px;
        }

        .color-filter-chips {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .color-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .color-chip {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .color-chip:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .color-chip.active {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .chip {
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .product-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
        }

        .product-image-container {
          position: relative;
          height: 280px;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sale-badge {
          background-color: #dc3545 !important;
        }

        .new-badge {
          background-color: #007bff !important;
        }

        .product-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card:hover .product-actions {
          opacity: 1;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.9);
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .action-btn:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .product-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a2c42;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .product-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
        }

        .product-style {
          background: #e9ecef;
          color: #495057;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .product-material {
          background: #f8f9fa;
          color: #6c757d;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #007bff;
        }

        .regular-price {
          font-size: 1rem;
          font-weight: 400;
          color: #6c757d;
          text-decoration: line-through;
        }

        .styling-tabs .nav-link {
          color: #6c757d;
          font-weight: 500;
          border: none;
          border-bottom: 2px solid transparent;
          background: none;
          padding: 15px 20px;
        }

        .styling-tabs .nav-link.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: none;
        }

        .styling-tips {
          list-style: none;
          padding: 0;
        }

        .styling-tips li {
          padding: 8px 0;
          padding-left: 20px;
          position: relative;
          line-height: 1.5;
        }

        .styling-tips li::before {
          content: '•';
          color: #007bff;
          font-weight: bold;
          position: absolute;
          left: 0;
        }

        @media (max-width: 768px) {
          .skirts-hero-content h1 {
            font-size: 2.5rem;
          }

          .skirts-hero-content p {
            font-size: 1.1rem;
          }

          .color-chips {
            justify-content: center;
          }

          .product-image-container {
            height: 250px;
          }
        }
      `}</style>
    </>
  );
};

export default SkirtsScreen; 