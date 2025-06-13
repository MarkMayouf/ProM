import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, ListGroup, Button, Card, Container, Image } from 'react-bootstrap';
import { FaArrowLeft, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromWishlist, clearWishlist } from '../slices/wishlistSlice';
import { addToCart } from '../slices/cartSlice';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { toast } from 'react-toastify';
import { useScrollToTop } from '../hooks/useScrollToTop';

const WishlistScreen = () => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist);
  const { wishlistItems } = wishlist;

  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  const removeFromWishlistHandler = (id) => {
    dispatch(removeFromWishlist(id));
    toast.success('Item removed from wishlist', { autoClose: 2000 });
  };

  const clearWishlistHandler = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      dispatch(clearWishlist());
      toast.success('Wishlist cleared', { autoClose: 2000 });
    }
  };

  const addToCartHandler = (item) => {
    dispatch(addToCart({ ...item, qty: 1 }));
    toast.success(`${item.name} added to cart`, { autoClose: 2000 });
  };

  const moveToCartHandler = (item) => {
    // Add to cart
    dispatch(addToCart({ ...item, qty: 1 }));
    // Remove from wishlist
    dispatch(removeFromWishlist(item._id));
    toast.success(`${item.name} moved to cart`, { autoClose: 2000 });
  };

  return (
    <Container>
      <Meta title="Wishlist" />
      <Row className="mt-3">
        <Col>
          <h1>My Wishlist</h1>
          <Link className="btn btn-light my-3" to="/">
            <FaArrowLeft className="me-1" /> Continue Shopping
          </Link>
          {wishlistItems.length === 0 ? (
            <Message>
              Your wishlist is empty. <Link to="/">Go back to shopping</Link>
            </Message>
          ) : (
            <>
              <Row className="mb-3">
                <Col className="d-flex justify-content-end">
                  <Button
                    variant="outline-danger"
                    className="btn-sm"
                    onClick={clearWishlistHandler}
                  >
                    <FaTrash className="me-1" /> Clear Wishlist
                  </Button>
                </Col>
              </Row>
              <ListGroup variant="flush">
                {wishlistItems.map((item) => (
                  <ListGroup.Item key={item._id} className="wishlist-item">
                    <Row className="align-items-center">
                      <Col xs={3} md={2}>
                        <Link to={`/product/${item._id}`}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Link>
                      </Col>
                      <Col xs={5} md={6}>
                        <Link to={`/product/${item._id}`} className="product-title">
                          {item.name}
                        </Link>
                        <div className="mt-2 small text-muted">
                          {item.category}
                          {item.brand && ` • ${item.brand}`}
                          {item.dateAdded && (
                            <div className="mt-1">
                              Saved: {new Date(item.dateAdded).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xs={4} md={2} className="text-end">
                        <div className="fw-bold mb-1">${item.price}</div>
                      </Col>
                      <Col xs={12} md={2} className="d-flex justify-content-end mt-2 mt-md-0">
                        <div className="d-flex flex-column gap-2">
                          <Button
                            type="button"
                            variant="outline-success"
                            className="btn-sm"
                            style={{ 
                              backgroundColor: '#d4edda', 
                              borderColor: '#28a745',
                              color: '#155724',
                              fontWeight: '500'
                            }}
                            onClick={() => moveToCartHandler(item)}
                            title="Move to Cart and Remove from Wishlist"
                          >
                            <FaShoppingCart className="me-1" /> Move to Cart
                          </Button>
                          <div className="d-flex gap-1">
                            <Button
                              type="button"
                              variant="outline-primary"
                              className="btn-sm flex-grow-1"
                              onClick={() => addToCartHandler(item)}
                              title="Add to Cart (Keep in Wishlist)"
                            >
                              <FaShoppingCart />
                            </Button>
                            <Button
                              type="button"
                              variant="outline-danger"
                              className="btn-sm"
                              onClick={() => removeFromWishlistHandler(item._id)}
                              title="Remove from Wishlist"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default WishlistScreen; 