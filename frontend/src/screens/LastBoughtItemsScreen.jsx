import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaShoppingBag, 
  FaCalendarAlt, 
  FaRuler, 
  FaHeart, 
  FaStar,
  FaShoppingCart,
  FaEye,
  FaTrophy,
  FaGift,
  FaCrown
} from 'react-icons/fa';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import Message from '../components/Message';
import Meta from '../components/Meta';
import '../assets/styles/last-bought-items.css';

const LastBoughtItemsScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { variant: 'warning', icon: '⏳' },
      'Processing': { variant: 'info', icon: '🔄' },
      'Shipped': { variant: 'primary', icon: '🚚' },
      'Delivered': { variant: 'success', icon: '✅' },
      'Cancelled': { variant: 'danger', icon: '❌' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', icon: '📦' };
    return (
      <Badge bg={config.variant} className="status-badge">
        {config.icon} {status}
      </Badge>
    );
  };

  const getSuitAlterations = (item) => {
    // Mock alteration data - in real app, this would come from the order item
    const alterations = {
      'Jacket Length': '2 inches shorter',
      'Sleeve Length': '1 inch shorter',
      'Trouser Length': '3 inches hemmed',
      'Waist': 'Taken in 1 inch'
    };
    
    if (item.category === 'Suits' || item.name.toLowerCase().includes('suit')) {
      return alterations;
    }
    return null;
  };

  const getRecommendations = () => {
    // Mock recommendations based on purchase history
    return [
      { id: 1, name: 'Premium Silk Tie', price: 89, image: '/images/tie1.jpg' },
      { id: 2, name: 'Leather Dress Shoes', price: 299, image: '/images/shoes1.jpg' },
      { id: 3, name: 'Pocket Square Set', price: 45, image: '/images/pocket-square.jpg' }
    ];
  };

  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your purchase history...</p>
      </Container>
    );
  }

  if (error) {
    return <Message variant="danger">{error?.data?.message || error.error}</Message>;
  }

  const recentOrders = orders?.slice(0, 5) || [];
  const totalSpent = orders?.reduce((sum, order) => sum + order.totalPrice, 0) || 0;
  const totalOrders = orders?.length || 0;

  return (
    <>
      <Meta title="Your Purchase History - Moore's Clothing" />
      <div className="last-bought-container">
        {/* Hero Welcome Section */}
        <div className="welcome-hero">
          <Container>
            <Row className="align-items-center">
              <Col lg={8}>
                <div className="welcome-content">
                  <h1 className="welcome-title">
                    {greeting}, {userInfo?.name || 'Valued Customer'}! <FaCrown className="crown-icon" />
                  </h1>
                  <p className="welcome-subtitle">
                    Welcome back to your personal style journey. Here's a look at your recent purchases and some exciting recommendations just for you.
                  </p>
                  <div className="stats-row">
                    <div className="stat-item">
                      <FaShoppingBag className="stat-icon" />
                      <div>
                        <div className="stat-number">{totalOrders}</div>
                        <div className="stat-label">Total Orders</div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FaTrophy className="stat-icon" />
                      <div>
                        <div className="stat-number">${totalSpent.toFixed(2)}</div>
                        <div className="stat-label">Total Spent</div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FaHeart className="stat-icon" />
                      <div>
                        <div className="stat-number">VIP</div>
                        <div className="stat-label">Member Status</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col lg={4} className="text-center">
                <div className="welcome-illustration">
                  <FaGift className="gift-icon" />
                  <p className="gift-text">Special offers await!</p>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="py-5">
          {/* Recent Orders Section */}
          <Row>
            <Col lg={8}>
              <Card className="orders-card shadow-lg">
                <Card.Header className="orders-header">
                  <h3 className="mb-0">
                    <FaShoppingBag className="me-2" />
                    Your Recent Purchases
                  </h3>
                </Card.Header>
                <Card.Body className="p-0">
                  {recentOrders.length === 0 ? (
                    <div className="empty-state">
                      <FaShoppingBag className="empty-icon" />
                      <h4>No orders yet</h4>
                      <p>Start shopping to see your purchase history here!</p>
                      <Button as={Link} to="/" variant="primary" size="lg">
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {recentOrders.map((order) => (
                        <div key={order._id} className="order-item">
                          <div className="order-header">
                            <div className="order-info">
                              <h5 className="order-id">Order #{order._id.slice(-8)}</h5>
                              <div className="order-meta">
                                <span className="order-date">
                                  <FaCalendarAlt className="me-1" />
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                                {getOrderStatusBadge(order.orderStatus || 'Delivered')}
                              </div>
                            </div>
                            <div className="order-total">
                              <span className="total-label">Total</span>
                              <span className="total-amount">${order.totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="order-items">
                            {order.orderItems.map((item, index) => (
                              <div key={index} className="item-row">
                                <div className="item-image">
                                  <img src={item.image} alt={item.name} />
                                </div>
                                <div className="item-details">
                                  <h6 className="item-name">{item.name}</h6>
                                  <div className="item-meta">
                                    <span className="item-qty">Qty: {item.qty}</span>
                                    <span className="item-price">${item.price}</span>
                                  </div>
                                  
                                  {/* Alteration Information for Suits */}
                                  {getSuitAlterations(item) && (
                                    <div className="alterations-info">
                                      <div className="alterations-header">
                                        <FaRuler className="me-1" />
                                        <strong>Your Alterations:</strong>
                                      </div>
                                      <div className="alterations-list">
                                        {Object.entries(getSuitAlterations(item)).map(([key, value]) => (
                                          <div key={key} className="alteration-item">
                                            <span className="alteration-type">{key}:</span>
                                            <span className="alteration-value">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="item-actions">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    as={Link}
                                    to={`/product/${item.product}`}
                                  >
                                    <FaEye className="me-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    className="mt-1"
                                  >
                                    <FaShoppingCart className="me-1" />
                                    Buy Again
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Recommendations Sidebar */}
            <Col lg={4}>
              <Card className="recommendations-card shadow-lg">
                <Card.Header className="recommendations-header">
                  <h4 className="mb-0">
                    <FaStar className="me-2" />
                    Recommended for You
                  </h4>
                </Card.Header>
                <Card.Body>
                  <p className="recommendations-subtitle">
                    Based on your style preferences
                  </p>
                  <div className="recommendations-list">
                    {getRecommendations().map((item) => (
                      <div key={item.id} className="recommendation-item">
                        <div className="rec-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="rec-details">
                          <h6 className="rec-name">{item.name}</h6>
                          <div className="rec-price">${item.price}</div>
                          <Button variant="outline-primary" size="sm" className="rec-btn">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="special-offer">
                    <div className="offer-content">
                      <h5>🎉 Special Offer!</h5>
                      <p>Get 15% off your next suit purchase</p>
                      <Button variant="warning" className="offer-btn">
                        Claim Offer
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Quick Actions */}
              <Card className="quick-actions-card shadow-lg mt-4">
                <Card.Header>
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="quick-actions">
                    <Button as={Link} to="/order-history" variant="outline-primary" className="action-btn">
                      View All Orders
                    </Button>
                    <Button as={Link} to="/profile" variant="outline-secondary" className="action-btn">
                      Update Profile
                    </Button>
                    <Button as={Link} to="/wishlist" variant="outline-danger" className="action-btn">
                      My Wishlist
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default LastBoughtItemsScreen; 