import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Form, Button, Card, Badge, Alert, ListGroup, ProgressBar } from 'react-bootstrap';
import { FaTruck, FaSearch, FaMapMarkerAlt, FaBoxOpen, FaCheckCircle, FaHome, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useGetOrderDetailsQuery } from '../slices/ordersApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';

const OrderTrackingScreen = () => {
  const { id: orderId } = useParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [trackingMode, setTrackingMode] = useState(orderId ? 'id' : 'tracking');
  const [isSubmitted, setIsSubmitted] = useState(!!orderId);

  // Only fetch order details if we have an order ID
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useGetOrderDetailsQuery(orderId, {
    skip: !orderId || !isSubmitted,
  });

  // Status steps
  const statusSteps = [
    { id: 'processing', label: 'Processing', icon: <FaBoxOpen />, percent: 10 },
    { id: 'packed', label: 'Packed', icon: <FaBoxOpen />, percent: 30 },
    { id: 'shipped', label: 'Shipped', icon: <FaTruck />, percent: 60 },
    { id: 'in_transit', label: 'In Transit', icon: <FaTruck />, percent: 75 },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: <FaTruck />, percent: 90 },
    { id: 'delivered', label: 'Delivered', icon: <FaCheckCircle />, percent: 100 },
  ];

  // Get the current status step
  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.isDelivered) return 5; // Delivered status
    
    // Map the order's shipping status to a step index
    const statusMap = {
      'processing': 0,
      'packed': 1,
      'shipped': 2,
      'in_transit': 3,
      'out_for_delivery': 4,
    };
    
    return statusMap[order.shippingStatus] || 0;
  };

  // Get progress percentage for the progress bar
  const getProgressPercentage = () => {
    if (!order) return 0;
    if (order.isDelivered) return 100;
    
    const statusMap = {
      'processing': 10,
      'packed': 30,
      'shipped': 60,
      'in_transit': 75,
      'out_for_delivery': 90,
    };
    
    return statusMap[order.shippingStatus] || 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (trackingMode === 'tracking' && !trackingNumber.trim()) {
      alert('Please enter a tracking number');
      return;
    }
    
    if (trackingMode === 'id' && !orderId) {
      alert('Please enter an order ID');
      return;
    }
    
    setIsSubmitted(true);
    if (orderId) {
      refetch();
    }
  };

  // Get variant for status badge
  const getStatusVariant = (status) => {
    const variantMap = {
      'processing': 'info',
      'packed': 'primary',
      'shipped': 'primary',
      'in_transit': 'primary',
      'out_for_delivery': 'warning',
      'delivered': 'success',
      'exception': 'danger',
      'returned': 'danger',
    };
    return variantMap[status] || 'secondary';
  };

  // Format the tracking events date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <Meta title="Order Tracking" />
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Link to="/" className="btn btn-light mb-3">
            <FaArrowLeft className="me-1" /> Back to Home
          </Link>
          
          <Card className="shadow-sm mb-5">
            <Card.Header className="bg-primary text-white py-3">
              <h4 className="mb-0">
                <FaTruck className="me-2" /> Order Tracking
              </h4>
            </Card.Header>
            <Card.Body>
              {/* Tracking Form */}
              {!isSubmitted && (
                <>
                  <p className="text-muted">
                    Track your order by entering your order ID or tracking number below.
                  </p>
                  
                  <Form onSubmit={handleSubmit} className="mb-4">
                    <Row className="mb-3">
                      <Col md={4} className="mb-3 mb-md-0">
                        <div className="d-flex">
                          <Form.Check
                            type="radio"
                            label="Order ID"
                            name="trackingMode"
                            id="trackingModeId"
                            checked={trackingMode === 'id'}
                            onChange={() => setTrackingMode('id')}
                            className="me-3"
                          />
                          <Form.Check
                            type="radio"
                            label="Tracking Number"
                            name="trackingMode"
                            id="trackingModeTracking"
                            checked={trackingMode === 'tracking'}
                            onChange={() => setTrackingMode('tracking')}
                          />
                        </div>
                      </Col>
                      <Col md={8}>
                        {trackingMode === 'id' ? (
                          <Form.Group controlId="orderId">
                            <Form.Control
                              type="text"
                              placeholder="Enter your order ID"
                              value={orderId || ''}
                              disabled={!!orderId}
                              required
                            />
                          </Form.Group>
                        ) : (
                          <Form.Group controlId="trackingNumber">
                            <Form.Control
                              type="text"
                              placeholder="Enter tracking number"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              required
                            />
                          </Form.Group>
                        )}
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={trackingMode === 'id' ? 12 : 8}>
                        {trackingMode === 'id' && (
                          <Form.Group controlId="email" className="mb-3">
                            <Form.Control
                              type="email"
                              placeholder="Enter the email used for the order (optional)"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </Form.Group>
                        )}
                      </Col>
                      <Col md={trackingMode === 'id' ? 12 : 4}>
                        <div className="d-grid">
                          <Button type="submit" variant="primary">
                            <FaSearch className="me-2" /> Track Order
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </>
              )}

              {/* Tracking Results */}
              {isSubmitted && (
                <>
                  {isLoading ? (
                    <Loader />
                  ) : error ? (
                    <Message variant="danger">
                      {error?.data?.message || "Unable to find order. Please check the order ID or tracking number and try again."}
                    </Message>
                  ) : order ? (
                    <div className="tracking-results">
                      {/* Order Info */}
                      <div className="order-info mb-4">
                        <Row>
                          <Col md={6}>
                            <h5 className="border-bottom pb-2 mb-3">Order Information</h5>
                            <p className="mb-1">
                              <strong>Order ID:</strong> {order._id}
                            </p>
                            <p className="mb-1">
                              <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="mb-3">
                              <strong>Customer:</strong> {order.user.name}
                            </p>
                            
                            <div className="mb-3">
                              <Badge 
                                bg={order.isPaid ? 'success' : 'danger'} 
                                className="me-2 p-2"
                              >
                                {order.isPaid ? 'Paid' : 'Unpaid'}
                              </Badge>
                              {order.refundProcessed && (
                                <Badge 
                                  bg="danger" 
                                  className="me-2 p-2"
                                >
                                  {order.isRefunded ? 'Fully Refunded' : 'Partially Refunded'}
                                </Badge>
                              )}
                              <Badge 
                                bg={order.isDelivered ? 'success' : getStatusVariant(order.shippingStatus)} 
                                className="p-2"
                              >
                                {order.isDelivered ? 'Delivered' : order.shippingStatus ? order.shippingStatus.replace(/_/g, ' ').toUpperCase() : 'Processing'}
                              </Badge>
                            </div>
                          </Col>
                          
                          <Col md={6}>
                            <h5 className="border-bottom pb-2 mb-3">Shipping Details</h5>
                            {order.trackingNumber ? (
                              <>
                                <p className="mb-1">
                                  <strong>Carrier:</strong> {order.shippingCarrier || 'Standard Shipping'}
                                </p>
                                <p className="mb-1">
                                  <strong>Tracking Number:</strong> <span className="font-monospace">{order.trackingNumber}</span>
                                </p>
                                {order.estimatedDelivery && (
                                  <p className="mb-3">
                                    <strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleDateString()}
                                  </p>
                                )}
                              </>
                            ) : (
                              <Alert variant="info" className="mb-3">
                                <FaExclamationTriangle className="me-2" />
                                Tracking information will be available once your order ships.
                              </Alert>
                            )}
                            
                            <div className="shipping-address p-2 bg-light rounded">
                              <div className="d-flex">
                                <FaMapMarkerAlt className="text-primary me-2 mt-1" />
                                <div>
                                  <p className="mb-1">{order.shippingAddress.address}</p>
                                  <p className="mb-1">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                                  <p className="mb-0">{order.shippingAddress.country}</p>
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                      
                      {/* Shipping Progress */}
                      <h5 className="border-bottom pb-2 mb-3">Shipping Progress</h5>
                      <ProgressBar 
                        now={getProgressPercentage()} 
                        variant={order.isDelivered ? 'success' : 'primary'}
                        className="mb-3"
                        style={{ height: '10px', borderRadius: '5px' }}
                      />
                      
                      <div className="shipping-steps mb-4">
                        <Row>
                          {statusSteps.map((step, index) => {
                            const currentStep = getCurrentStep();
                            const isCompleted = index <= currentStep;
                            const isActive = index === currentStep;
                            
                            return (
                              <Col key={step.id} xs={4} md={2} className="text-center mb-3">
                                <div 
                                  className={`status-icon mx-auto mb-2 ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isCompleted ? '#28a745' : '#f8f9fa',
                                    color: isCompleted ? '#fff' : '#6c757d',
                                    border: isActive ? '2px solid #007bff' : '1px solid #dee2e6',
                                    fontSize: '1.25rem',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  {step.icon}
                                </div>
                                <div className="status-label small" style={{ color: isActive ? '#007bff' : isCompleted ? '#28a745' : '#6c757d' }}>
                                  {step.label}
                                </div>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                      
                      {/* Tracking History */}
                      <h5 className="border-bottom pb-2 mb-3">Tracking History</h5>
                      {order.trackingEvents && order.trackingEvents.length > 0 ? (
                        <div className="tracking-timeline">
                          <ListGroup variant="flush">
                            {order.trackingEvents.map((event, index) => (
                              <ListGroup.Item key={index} className="border-start border-primary border-3 ps-3 mb-2">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <p className="fw-bold mb-1">{event.description}</p>
                                    <p className="mb-0 small">
                                      <FaMapMarkerAlt className="me-1 text-secondary" /> {event.location}
                                    </p>
                                  </div>
                                  <Badge bg="light" text="dark" className="p-2">
                                    {formatDate(event.date)}
                                  </Badge>
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      ) : (
                        <Alert variant="light" className="text-center">
                          No tracking updates available yet.
                        </Alert>
                      )}
                      
                      {/* Order Items */}
                      <h5 className="border-bottom pb-2 my-4">Order Items</h5>
                      <Row>
                        {order.orderItems.map((item, index) => (
                          <Col key={index} xs={12} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                              <div className="d-flex">
                                <div style={{ width: '80px', height: '80px' }} className="p-2">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="img-fluid" 
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                  />
                                </div>
                                <div className="p-2 flex-grow-1">
                                  <h6 className="mb-1">{item.name}</h6>
                                  <p className="mb-1 small">Qty: {item.qty}</p>
                                  <p className="mb-0 small text-muted">${item.price.toFixed(2)} each</p>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                      
                      {/* Track Another Order button */}
                      <div className="text-center mt-4">
                        <Button 
                          variant="outline-primary" 
                          onClick={() => setIsSubmitted(false)}
                        >
                          Track Another Order
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Message>No tracking information found. Please check the details and try again.</Message>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderTrackingScreen; 