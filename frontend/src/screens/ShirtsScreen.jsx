import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaShoppingCart, FaHeart, FaEye, FaStar, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { addToCart } from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import Loader from '../components/Loader';
import Meta from '../components/Meta';

const ShirtsScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Animation state
  const [animatedElements, setAnimatedElements] = useState({
    shirtsShowcase: false
  });

  const {
    data,
    isLoading,
    error
  } = useGetProductsQuery({ pageNumber: 1 });

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedElements({ shirtsShowcase: true }), 300);
    return () => clearTimeout(timer);
  }, []);

  // Get full image URL with error handling
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '/images/placeholder.png';
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  };

  // Add to cart handler
  const handleAddToCart = (product) => {
    if (product.countInStock === 0) {
      toast.error('Sorry, this product is out of stock');
      return;
    }

    dispatch(addToCart({ ...product, qty: 1 }));
    toast.success(`${product.name} added to cart`);
  };

  // Quick view handler
  const handleQuickView = (product) => {
    navigate(`/product/${product._id}`);
  };

  return (
    <>
      <Meta title="Premium Shirts Collection | Jos Bank" />
      
      {/* Shirts Collection */}
      <section
        id='shirtsShowcase'
        className={`featured-products-hugo ${
          animatedElements.shirtsShowcase ? 'section-visible' : ''
        }`}
      >
        <Container fluid className="px-0">
          <div className='hugo-section-header'>
            <Container>
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="hugo-title-block">
                    <span className="hugo-subtitle">SHIRTS COLLECTION</span>
                    <h2 className="hugo-main-title">Premium Shirts</h2>
                    <p className="hugo-description">
                      Step into elegance with our handcrafted shirts collection, featuring premium fabrics and timeless designs.
                    </p>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <div className="hugo-controls">
                    <div className="hugo-product-count">
                      {data?.products ? `${data.products.filter(p => p.category === 'Shirts').length} shirts available` : ''}
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
                <p className="mt-3">Loading shirts collection...</p>
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
                  {data?.products && data.products.filter(product => product.category === 'Shirts').slice(0, 4).map((product, index) => (
                    <div 
                      key={`shirts-${product._id}`} 
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
                                  <span className="hugo-view-text">View Shirts</span>
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
                              title="Quick View Shirts"
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
                      <h3>Explore Our Complete Shirts Collection</h3>
                        <p>Discover the full range of premium shirts for every style</p>
                    </div>
                    <button
                      className='hugo-view-all-btn'
                        onClick={() => navigate('/category/shirts')}
                    >
                      <span>View All Shirts</span>
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
  );
};

export default ShirtsScreen;
