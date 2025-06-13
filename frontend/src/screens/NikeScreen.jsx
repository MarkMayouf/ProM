import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Carousel, 
  Badge, 
  Tab, 
  Nav, 
  Form 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaRegHeart, 
  FaChevronRight, 
  FaRunning, 
  FaBasketballBall, 
  FaFutbol, 
  FaTshirt, 
  FaShoePrints, 
  FaArrowRight, 
  FaStar 
} from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';

const NikeScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);
  
  // State for active category and sorting
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch Nike products
  const { data, isLoading, error } = useGetProductsQuery({
    brand: 'nike',
    pageNumber: 1
  });
  
  // State for filtered products
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  // Nike product categories
  const categories = [
    { id: 'all', name: 'All Products', icon: <FaShoePrints /> },
    { id: 'running', name: 'Running', icon: <FaRunning /> },
    { id: 'basketball', name: 'Basketball', icon: <FaBasketballBall /> },
    { id: 'soccer', name: 'Soccer', icon: <FaFutbol /> },
    { id: 'apparel', name: 'Apparel', icon: <FaTshirt /> }
  ];
  
  // Featured collections
  const collections = [
    {
      id: 'air-jordan',
      name: 'Air Jordan',
      description: 'Iconic basketball shoes with legendary performance and style',
      image: '/images/collections/air-jordan.jpg',
      cta: 'Shop Air Jordan'
    },
    {
      id: 'air-max',
      name: 'Air Max',
      description: 'Revolutionary cushioning for maximum comfort and impact protection',
      image: '/images/collections/air-max.jpg',
      cta: 'Shop Air Max'
    },
    {
      id: 'running-essentials',
      name: 'Running Essentials',
      description: 'Performance running gear designed for speed and endurance',
      image: '/images/collections/nike-running.jpg',
      cta: 'Shop Running'
    }
  ];
  
  // Nike innovations to showcase
  const innovations = [
    {
      name: 'Nike Air',
      description: 'Revolutionary cushioning system that uses pressurized air in a flexible membrane for lightweight impact protection',
      image: '/images/innovations/nike-air.jpg'
    },
    {
      name: 'Flyknit',
      description: 'Engineered knit material that is lightweight, form-fitting and virtually seamless for superior comfort',
      image: '/images/innovations/flyknit.jpg'
    },
    {
      name: 'React',
      description: 'Lightweight, durable foam that delivers a soft, responsive ride and energy return with every step',
      image: '/images/innovations/react.jpg'
    }
  ];
  
  // Filter and sort products
  useEffect(() => {
    if (data && data.products) {
      let products = [...data.products];
      
      // Filter by category
      if (activeCategory !== 'all') {
        products = products.filter(product => 
          product.subcategory && product.subcategory.toLowerCase() === activeCategory.toLowerCase()
        );
      }
      
      // Sort products
      switch (sortBy) {
        case 'price-low-high':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price-high-low':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'top-rated':
          products.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // 'newest' - default sorting
          break;
      }
      
      setFilteredProducts(products);
      
      // Set featured products (top rated or new releases)
      const featured = [...data.products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      setFeaturedProducts(featured);
    }
  }, [data, activeCategory, sortBy]);
  
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
        <title>Nike Collection | ProMayouf</title>
        <meta name="description" content="Explore our exclusive Nike collection featuring the latest shoes, apparel, and accessories." />
      </Helmet>
      
      {/* Hero Banner */}
      <section className="nike-hero">
        <div className="nike-hero-overlay"></div>
        <Container className="position-relative">
          <div className="nike-hero-content">
            <div className="nike-logo mb-4">
              <img src="/images/nike-logo-white.png" alt="Nike" width="120" />
            </div>
            <h1 className="hero-title">JUST DO IT</h1>
            <p className="hero-subtitle">Discover the latest Nike innovations for your active lifestyle</p>
            <Button 
              variant="light" 
              size="lg" 
              className="hero-btn mt-3"
              onClick={() => document.getElementById('nike-products').scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Collection
            </Button>
          </div>
        </Container>
      </section>
      
      {/* Breadcrumb */}
      <Container className="my-4">
        <div className="nike-breadcrumb">
          <Link to="/">Home</Link> / <span>Nike Collection</span>
        </div>
      </Container>
      
      {/* Featured Collections */}
      <section className="nike-collections py-5 bg-light">
        <Container>
          <h2 className="section-title mb-4">Featured Collections</h2>
          <Row>
            {collections.map(collection => (
              <Col md={4} key={collection.id} className="mb-4">
                <Card className="collection-card h-100 border-0 shadow-sm">
                  <div className="collection-image-container">
                    <Card.Img variant="top" src={collection.image} alt={collection.name} className="collection-image" />
                    <div className="collection-overlay d-flex align-items-center justify-content-center">
                      <Button 
                        variant="light" 
                        className="collection-btn"
                        onClick={() => navigate(`/search/${collection.id}`)}
                      >
                        {collection.cta} <FaChevronRight size={12} className="ms-1" />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title className="collection-title">{collection.name}</Card.Title>
                    <Card.Text>{collection.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <section className="featured-products py-5">
          <Container>
            <h2 className="section-title mb-4">Top Rated Nike Products</h2>
            <Row>
              {featuredProducts.map(product => (
                <Col md={4} key={product._id} className="mb-4">
                  <Card className="featured-product-card h-100 border-0 shadow-sm">
                    <div className="featured-badge">
                      <div className="badge-content">
                        <FaStar className="me-1" /> Top Rated
                      </div>
                    </div>
                    <div className="featured-image-container">
                      <Card.Img variant="top" src={product.image} alt={product.name} className="featured-image" />
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <Badge bg="dark" className="product-category">
                          {product.subcategory || product.category}
                        </Badge>
                      </div>
                      <Card.Title className="product-title">{product.name}</Card.Title>
                      <div className="product-rating mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={`rating-star ${i < Math.floor(product.rating) ? 'filled' : ''}`} 
                          />
                        ))}
                        <span className="rating-number ms-2">{product.rating}</span>
                      </div>
                      <Card.Text className="product-description flex-grow-1">
                        {product.description?.substring(0, 100)}...
                      </Card.Text>
                      <div className="product-price-container d-flex justify-content-between align-items-center">
                        <div className="product-price">${product.price.toFixed(2)}</div>
                        <Button 
                          variant="primary" 
                          className="view-btn"
                          onClick={() => handleViewDetails(product._id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}
      
      {/* Nike Innovations */}
      <section className="nike-innovations py-5 bg-dark text-white">
        <Container>
          <h2 className="section-title text-white mb-5">Nike Innovations</h2>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="innovation-image-container">
                <Carousel fade interval={5000} indicators={false} controls={false}>
                  {innovations.map((innovation, idx) => (
                    <Carousel.Item key={idx}>
                      <img 
                        src={innovation.image} 
                        alt={innovation.name} 
                        className="innovation-image" 
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </Col>
            <Col lg={6}>
              <Tab.Container defaultActiveKey="0">
                <div className="innovations-content">
                  <Nav className="innovations-nav mb-4">
                    {innovations.map((innovation, idx) => (
                      <Nav.Item key={idx}>
                        <Nav.Link eventKey={idx.toString()} className="innovation-nav-link">
                          {innovation.name}
                        </Nav.Link>
                      </Nav.Item>
                    ))}
                  </Nav>
                  <Tab.Content>
                    {innovations.map((innovation, idx) => (
                      <Tab.Pane key={idx} eventKey={idx.toString()}>
                        <h3 className="innovation-title">{innovation.name}</h3>
                        <p className="innovation-description">{innovation.description}</p>
                        <Button 
                          variant="outline-light" 
                          className="mt-3"
                          onClick={() => navigate(`/search/${innovation.name.toLowerCase().replace(' ', '-')}`)}
                        >
                          Shop Products with {innovation.name}
                        </Button>
                      </Tab.Pane>
                    ))}
                  </Tab.Content>
                </div>
              </Tab.Container>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Nike Products */}
      <section id="nike-products" className="nike-products py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">Nike Products</h2>
            <Form.Select 
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="top-rated">Top Rated</option>
            </Form.Select>
          </div>
          
          {/* Category filter */}
          <div className="category-filter mb-4">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'dark' : 'outline-dark'}
                className="category-btn me-2 mb-2"
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
          
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
                  <h3>No Nike products found</h3>
                  <p className="text-muted">Try selecting a different category</p>
                  <Button variant="dark" onClick={() => setActiveCategory('all')}>
                    View All Products
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4">Showing {filteredProducts.length} products</p>
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
                              <Badge bg="success" className="product-badge new-badge">New</Badge>
                            )}
                            <div className="product-actions">
                              <Button 
                                variant="dark" 
                                className="action-btn"
                                onClick={() => handleAddToCart(product)}
                                title="Add to Cart"
                              >
                                <FaShoppingCart />
                              </Button>
                              <Button 
                                variant="dark" 
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
                            </div>
                          </div>
                          <Card.Body>
                            <Badge bg="secondary" className="mb-2">
                              {product.subcategory || product.category}
                            </Badge>
                            <Card.Title className="product-title">{product.name}</Card.Title>
                            <div className="product-rating mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={`rating-star ${i < Math.floor(product.rating) ? 'filled' : ''}`} 
                                />
                              ))}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <div className="product-price">${product.price.toFixed(2)}</div>
                              <Button 
                                variant="dark" 
                                size="sm" 
                                className="view-btn"
                                onClick={() => handleViewDetails(product._id)}
                              >
                                View
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </>
          )}
        </Container>
      </section>
      
      {/* Call to Action */}
      <section className="nike-cta py-5 bg-dark text-white">
        <Container className="text-center">
          <h2 className="cta-title">Become a Nike Member</h2>
          <p className="cta-text">Sign up for Nike membership to get exclusive offers, inspiration and community connections.</p>
          <Button 
            variant="light" 
            size="lg" 
            className="mt-3"
            onClick={() => navigate('/register')}
          >
            Join Now <FaArrowRight className="ms-2" />
          </Button>
        </Container>
      </section>
      
      {/* Component Styles */}
      <style jsx="true">{`
        .nike-hero {
          background: url('/images/nike-hero.jpg') no-repeat center center;
          background-size: cover;
          height: 500px;
          position: relative;
          display: flex;
          align-items: center;
          color: white;
        }
        
        .nike-hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .nike-hero-content {
          max-width: 600px;
          position: relative;
          z-index: 1;
        }
        
        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          letter-spacing: 2px;
        }
        
        .hero-subtitle {
          font-size: 1.3rem;
          opacity: 0.9;
        }
        
        .hero-btn {
          border-radius: 0;
          padding: 0.6rem 2rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .nike-breadcrumb {
          font-size: 14px;
          color: #6c757d;
        }
        
        .nike-breadcrumb a {
          color: #212529;
          text-decoration: none;
        }
        
        .nike-breadcrumb a:hover {
          text-decoration: underline;
        }
        
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .collection-card {
          transition: all 0.3s ease;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .collection-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
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
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .collection-card:hover .collection-overlay {
          opacity: 1;
        }
        
        .collection-btn {
          text-transform: uppercase;
          font-weight: 600;
          padding: 0.6rem 1.5rem;
          border-radius: 0;
        }
        
        .collection-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .featured-product-card {
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .featured-product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .featured-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 10;
        }
        
        .badge-content {
          background-color: #212529;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        
        .featured-image-container {
          height: 250px;
          overflow: hidden;
        }
        
        .featured-image {
          height: 100%;
          width: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .featured-product-card:hover .featured-image {
          transform: scale(1.05);
        }
        
        .product-category {
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.35rem 0.7rem;
          border-radius: 3px;
        }
        
        .product-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        
        .product-description {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 1rem;
        }
        
        .rating-star {
          color: #d9d9d9;
          font-size: 0.9rem;
        }
        
        .rating-star.filled {
          color: #ffc107;
        }
        
        .rating-number {
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        .product-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: #212529;
        }
        
        .view-btn {
          border-radius: 0;
          font-weight: 600;
          padding: 0.4rem 1rem;
          text-transform: uppercase;
        }
        
        .innovation-image-container {
          height: 400px;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .innovation-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .innovations-nav {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .innovation-nav-link {
          color: rgba(255, 255, 255, 0.7);
          background: transparent;
          border: none;
          padding: 1rem 1.5rem;
          margin-right: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .innovation-nav-link.active {
          color: white;
          background: transparent;
        }
        
        .innovation-nav-link.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: white;
        }
        
        .innovation-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .innovation-description {
          font-size: 1.1rem;
          line-height: 1.6;
          opacity: 0.9;
        }
        
        .category-btn {
          border-radius: 30px;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }
        
        .category-icon {
          margin-right: 0.5rem;
        }
        
        .product-card {
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
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
          padding: 0.3rem 0.6rem;
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
          background: rgba(255, 255, 255, 0.9);
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
        
        .cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }
        
        .cta-text {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 700px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .nike-hero {
            height: 400px;
          }
          
          .hero-title {
            font-size: 3rem;
          }
          
          .section-title {
            font-size: 1.8rem;
          }
          
          .innovation-image-container {
            height: 300px;
            margin-bottom: 2rem;
          }
          
          .cta-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default NikeScreen; 