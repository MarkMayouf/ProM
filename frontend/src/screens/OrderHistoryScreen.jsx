import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Alert,
  Spinner,
  Modal,
  ListGroup,
  Image
} from 'react-bootstrap';
import {
  FaShoppingBag,
  FaEye,
  FaDownload,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBox,
  FaCheckCircle,
  FaTruck,
  FaClipboardList,
  FaArrowLeft
} from 'react-icons/fa';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { getFullImageUrl } from '../utils/imageUtils';
import '../assets/styles/order-history.css';

const OrderHistoryScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const { data: orders, isLoading, error, refetch } = useGetMyOrdersQuery();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FaCheckCircle />;
      case 'shipped':
        return <FaTruck />;
      case 'processing':
        return <FaBox />;
      default:
        return <FaClipboardList />;
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  if (!userInfo) {
    return <Loader />;
  }

  return (
    <>
      <Meta title="Order History - ProMayouf" />
      <div className="order-history-page">
        <Container className="py-5">
          {/* Header Section */}
          <div className="order-history-header mb-5">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center mb-3">
                  <Button
                    variant="outline-primary"
                    className="me-3"
                    onClick={() => navigate('/profile')}
                  >
                    <FaArrowLeft className="me-2" />
                    Back to Profile
                  </Button>
                </div>
                <h1 className="order-history-title">
                  <FaShoppingBag className="me-3 text-primary" />
                  My Order History
                </h1>
                <p className="order-history-subtitle">
                  Track and manage all your purchases
                </p>
              </Col>
              <Col md={4} className="text-end">
                {orders && (
                  <div className="order-stats">
                    <div className="stat-item">
                      <div className="stat-number">{orders.length}</div>
                      <div className="stat-label">Total Orders</div>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </div>

          {/* Orders Content */}
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <div className="mt-3">
                <h5>Loading your orders...</h5>
                <p className="text-muted">Please wait while we fetch your order history</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center py-4">
              <h5>Error Loading Orders</h5>
              <p>{error?.data?.message || error.error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Try Again
              </Button>
            </Alert>
          ) : !orders || orders.length === 0 ? (
            <div className="empty-orders text-center py-5">
              <div className="empty-icon mb-4">
                <FaShoppingBag size={80} className="text-muted" />
              </div>
              <h3>No Orders Yet</h3>
              <p className="text-muted mb-4">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/')}
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="orders-list">
              <Row>
                {orders.map((order) => (
                  <Col lg={12} key={order._id} className="mb-4">
                    <Card className="order-card h-100 shadow-sm">
                      <Card.Body className="p-4">
                        <Row className="align-items-center">
                          <Col md={3}>
                            <div className="order-info">
                              <h6 className="order-number mb-2">
                                Order #{order._id.slice(-8).toUpperCase()}
                              </h6>
                              <div className="order-date text-muted">
                                <FaCalendarAlt className="me-2" />
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                          </Col>
                          
                          <Col md={2}>
                            <div className="order-status">
                              <Badge 
                                bg={getOrderStatusColor(order.orderStatus)} 
                                className="status-badge"
                              >
                                {getStatusIcon(order.orderStatus)}
                                <span className="ms-2">{order.orderStatus || 'Processing'}</span>
                              </Badge>
                            </div>
                          </Col>

                          <Col md={2}>
                            <div className="order-items">
                              <div className="items-count">
                                {order.orderItems.length} {order.orderItems.length === 1 ? 'Item' : 'Items'}
                              </div>
                              <div className="items-preview">
                                {order.orderItems.slice(0, 3).map((item, index) => (
                                  <Image
                                    key={index}
                                    src={getFullImageUrl(item.image)}
                                    alt={item.name}
                                    className="item-thumbnail"
                                    roundedCircle
                                  />
                                ))}
                                {order.orderItems.length > 3 && (
                                  <span className="more-items">+{order.orderItems.length - 3}</span>
                                )}
                              </div>
                            </div>
                          </Col>

                          <Col md={2}>
                            <div className="order-total">
                              <div className="total-amount">
                                {formatCurrency(order.totalPrice)}
                              </div>
                              <div className="payment-method text-muted small">
                                <FaCreditCard className="me-1" />
                                {order.paymentMethod || 'Card'}
                              </div>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div className="order-actions d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <FaEye className="me-1" />
                                View Details
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate(`/order/${order._id}`)}
                              >
                                <FaDownload className="me-1" />
                                Receipt
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Container>

        {/* Order Details Modal */}
        <Modal 
          show={showOrderModal} 
          onHide={handleCloseModal} 
          size="xl"
          className="order-details-modal"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Order Details - #{selectedOrder?._id.slice(-8).toUpperCase()}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <Container fluid>
                {/* Order Summary */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="info-card">
                      <Card.Body>
                        <h6 className="card-title">
                          <FaCalendarAlt className="me-2" />
                          Order Information
                        </h6>
                        <div className="info-list">
                          <div className="info-item">
                            <span className="label">Order Date:</span>
                            <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Status:</span>
                            <Badge bg={getOrderStatusColor(selectedOrder.orderStatus)}>
                              {selectedOrder.orderStatus || 'Processing'}
                            </Badge>
                          </div>
                          <div className="info-item">
                            <span className="label">Payment Method:</span>
                            <span className="value">{selectedOrder.paymentMethod || 'Card'}</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="info-card">
                      <Card.Body>
                        <h6 className="card-title">
                          <FaMapMarkerAlt className="me-2" />
                          Shipping Address
                        </h6>
                        <div className="address-info">
                          <div>{selectedOrder.shippingAddress?.address}</div>
                          <div>
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}
                          </div>
                          <div>{selectedOrder.shippingAddress?.country}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Order Items */}
                <Card className="mb-4">
                  <Card.Header>
                    <h6 className="mb-0">
                      <FaBox className="me-2" />
                      Order Items ({selectedOrder.orderItems.length})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      {selectedOrder.orderItems.map((item, index) => (
                        <ListGroup.Item key={index} className="p-3">
                          <Row className="align-items-center">
                            <Col md={2}>
                              <Image
                                src={getFullImageUrl(item.image)}
                                alt={item.name}
                                className="item-image"
                                fluid
                                rounded
                              />
                            </Col>
                            <Col md={5}>
                              <h6 className="item-name">{item.name}</h6>
                              <div className="item-details text-muted">
                                <small>Category: {item.category}</small>
                                {item.size && <small className="ms-3">Size: {item.size}</small>}
                                {item.color && <small className="ms-3">Color: {item.color}</small>}
                              </div>
                            </Col>
                            <Col md={2} className="text-center">
                              <div className="quantity">
                                Qty: {item.qty}
                              </div>
                            </Col>
                            <Col md={2} className="text-center">
                              <div className="unit-price">
                                {formatCurrency(item.price)}
                              </div>
                            </Col>
                            <Col md={1} className="text-end">
                              <div className="total-price fw-bold">
                                {formatCurrency(item.price * item.qty)}
                              </div>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>

                {/* Order Summary */}
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Order Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={8}></Col>
                      <Col md={4}>
                        <div className="summary-row">
                          <span>Items Total:</span>
                          <span>{formatCurrency(selectedOrder.itemsPrice)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Shipping:</span>
                          <span>{formatCurrency(selectedOrder.shippingPrice)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Tax:</span>
                          <span>{formatCurrency(selectedOrder.taxPrice)}</span>
                        </div>
                        <hr />
                        <div className="summary-row total">
                          <span><strong>Total:</strong></span>
                          <span><strong>{formatCurrency(selectedOrder.totalPrice)}</strong></span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Container>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/order/${selectedOrder?._id}`)}
            >
              View Full Order
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default OrderHistoryScreen;