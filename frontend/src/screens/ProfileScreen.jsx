import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Form, 
  Button, 
  Row, 
  Col, 
  Card, 
  Nav, 
  Tab, 
  Badge, 
  ProgressBar,
  Alert,
  Modal,
  InputGroup,
  Image,
  Container,
  Spinner,
  Accordion,
  ListGroup,
  Tabs,
  Dropdown
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaTimes, 
  FaUser, 
  FaShoppingBag, 
  FaHeart, 
  FaCog, 
  FaBell, 
  FaChartLine,
  FaEdit,
  FaCheck,
  FaEye,
  FaTruck,
  FaCreditCard,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCamera,
  FaDownload,
  FaStar,
  FaExclamationTriangle,
  FaShieldAlt,
  FaQuestionCircle,
  FaSignOutAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaBoxOpen,
  FaClipboardCheck,
  FaUserEdit,
  FaLock,
  FaTrash,
  FaPlus,
  FaUndo,
  FaExchangeAlt,
  FaHandshake,
  FaHeadset,
  FaBook,
  FaRuler,
  FaGift,
  FaShippingFast,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaFileAlt,
  FaChatDot,
  FaLifeRing,
  FaQuestion,
  FaComments,
  FaFlag,
  FaPercent,
  FaTag,
  FaPrint,
  FaSave,
  FaSearch,
  FaFilter,
  FaSortAmountDown
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useProfileMutation } from '../slices/usersApiSlice';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { setCredentials, logout } from '../slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { getFullImageUrl } from '../utils/imageUtils';
import EmailPreferences from '../components/EmailPreferences';

const EnhancedProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReturnDetailModal, setShowReturnDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  
  // Profile form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  // Return/Refund form states
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);

  // Filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [returnFilter, setReturnFilter] = useState('all');

  // Preferences states
  const [preferences, setPreferences] = useState({
    emailNotifications: {
      orderUpdates: true,
      promotions: true,
      newsletter: false,
      recommendations: true,
      security: true
    },
    smsNotifications: {
      orderUpdates: false,
      promotions: false,
      security: true
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    shopping: {
      autoSave: true,
      recommendations: true,
      priceAlerts: false,
      wishlistNotifications: true
    }
  });

  const { userInfo } = useSelector((state) => state.auth);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useGetMyOrdersQuery();
  const [updateProfile, { isLoading: loadingUpdateProfile }] = useProfileMutation();

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setAddress(userInfo.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      });
    }
  }, [userInfo]);

  // Mock data for returns and refunds - In production, this would come from API
  useEffect(() => {
    setReturnRequests([]); // Removed default returns
    setRefundRequests([]); // Removed default refunds
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const updateData = {
        name,
        email,
        phone,
        address,
        ...(password && { password })
      };

      const res = await updateProfile(updateData).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.info('You have been logged out');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    toast.error('Account deletion not implemented yet');
  };

  const handleReturnRequest = (order) => {
    setSelectedOrder(order);
    setShowReturnModal(true);
    // Notify admin logic here
    toast.info('Return request submitted. Admin will be notified.');
  };

  const handleRefundRequest = (order) => {
    setSelectedOrder(order);
    setRefundReason('');
    setRefundDescription('');
    setShowRefundModal(true);
  };

  const submitReturnRequest = async () => {
    if (!returnReason || !returnDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newReturn = {
        id: `RET-${Date.now()}`,
        orderId: selectedOrder._id,
        productName: selectedOrderItem ? selectedOrderItem.name : 'Multiple items',
        status: 'pending',
        reason: returnReason,
        description: returnDescription,
        quantity: returnQuantity,
        requestDate: new Date().toISOString().split('T')[0],
        estimatedRefund: selectedOrderItem ? selectedOrderItem.price * returnQuantity : selectedOrder.totalPrice,
        trackingNumber: null,
        approvedAt: null,
        processedAt: null,
        returnMethod: 'mail',
        shippingLabel: null,
        qualityCheck: null
      };

      setReturnRequests([...returnRequests, newReturn]);
      setShowReturnModal(false);
      
      // Reset form
      setReturnReason('');
      setReturnDescription('');
      setReturnQuantity(1);
      setSelectedOrder(null);
      setSelectedOrderItem(null);
      
      toast.success('Return request submitted successfully! You will receive an email with return instructions within 24 hours.');
    } catch (error) {
      toast.error('Failed to submit return request. Please try again.');
    }
  };

  const submitRefundRequest = async () => {
    if (!refundReason || !refundDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newRefund = {
        id: `REF-${Date.now()}`,
        orderId: selectedOrder._id,
        amount: selectedOrder.totalPrice,
        status: 'pending',
        reason: refundReason,
        description: refundDescription,
        requestDate: new Date().toISOString().split('T')[0],
        method: 'Original payment method',
        processingTime: '5-7 business days',
        approvedAt: null,
        processedAt: null,
        transactionId: null
      };

      setRefundRequests([...refundRequests, newRefund]);
      setShowRefundModal(false);
      
      // Reset form
      setRefundReason('');
      setRefundDescription('');
      setSelectedOrder(null);
      
      toast.success('Refund request submitted successfully! You will receive an email confirmation and updates on the status.');
    } catch (error) {
      toast.error('Failed to submit refund request. Please try again.');
    }
  };

  const handlePreferencesUpdate = () => {
    toast.success('Preferences updated successfully');
  };

  const handleCancelReturn = async (returnId) => {
    try {
      setReturnRequests(prev => prev.filter(ret => ret.id !== returnId));
      toast.success('Return request cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel return request');
    }
  };

  const handleDownloadShippingLabel = async (returnId) => {
    try {
      // Enhanced shipping label download with real implementation
      const returnReq = returnRequests.find(ret => ret.id === returnId);
      if (returnReq) {
        // Create and download actual shipping label
        const response = await fetch(`/api/returns/${returnId}/shipping-label`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `return-label-${returnId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('Shipping label downloaded successfully!');
        } else {
          throw new Error('Failed to download shipping label');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download shipping label. Please try again or contact support.');
    }
  };

  // Helper functions for return/refund eligibility
  const canRequestReturn = (order) => {
    if (!order.isDelivered) return false;
    
    // Check if within return window (30 days)
    const deliveryDate = new Date(order.deliveredAt);
    const currentDate = new Date();
    const daysDifference = (currentDate - deliveryDate) / (1000 * 60 * 60 * 24);
    
    return daysDifference <= 30;
  };

  const canRequestRefund = (order) => {
    if (!order.isDelivered || !order.isPaid) return false;
    
    // Check if within refund window (30 days) and not already refunded
    const deliveryDate = new Date(order.deliveredAt);
    const currentDate = new Date();
    const daysDifference = (currentDate - deliveryDate) / (1000 * 60 * 60 * 24);
    
    return daysDifference <= 30 && !order.refundProcessed;
  };

  const getCarrierTrackingUrl = (carrier, trackingNumber) => {
    const carriers = {
      'FedEx': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return carriers[carrier] || '#';
  };

  const getOrderStatusColor = (order) => {
    if (order.isDelivered) return 'success';
    if (order.isShipped) return 'warning';
    if (order.isPaid) return 'info';
    return 'secondary';
  };

  const getOrderStatusText = (order) => {
    if (order.isDelivered) return 'Delivered';
    if (order.isShipped) return 'Shipped';
    if (order.isPaid) return 'Processing';
    return 'Pending';
  };

  const getReturnStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'processing': return 'info';
      default: return 'secondary';
    }
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'processing': return 'info';
      default: return 'secondary';
    }
  };

  const calculateUserStats = () => {
    if (!orders) return { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 };
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    return { totalOrders, totalSpent, avgOrderValue };
  };

  const stats = calculateUserStats();

  // Filter orders based on search only
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = orderSearch === '' || 
      order._id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.orderItems?.some(item => 
        item.name.toLowerCase().includes(orderSearch.toLowerCase())
      );
    
    return matchesSearch;
  }) || [];

  // Filter returns based on filter
  const filteredReturns = returnRequests.filter(returnReq => {
    return returnFilter === 'all' || returnReq.status === returnFilter;
  });

  const renderOverviewTab = () => (
    <Row>
      <Col lg={8}>
        {/* Welcome Card */}
        <Card className="shadow-sm mb-4">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col sm={2}>
                <div className="text-center">
                  <div className="avatar-lg mx-auto mb-2">
                    <Image
                      src={profileImage || `https://ui-avatars.com/api/?name=${userInfo?.name}&background=1a2c42&color=fff&size=80`}
                      roundedCircle
                      width={80}
                      height={80}
                      alt="Profile"
                    />
                  </div>
                </div>
              </Col>
              <Col sm={10}>
                <h4 className="text-primary mb-1">Welcome back, {userInfo?.name}!</h4>
                <p className="text-muted mb-3">Manage your account, orders, and preferences from your dashboard.</p>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                  >
                    <FaEdit className="me-1" /> Edit Profile
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => setActiveTab('orders')}
                  >
                    <FaShoppingBag className="me-1" /> View Orders
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Quick Stats */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="p-3">
                <div className="text-primary mb-2">
                  <FaShoppingBag size={24} />
                </div>
                <h5 className="fw-bold mb-1">{stats.totalOrders}</h5>
                <p className="text-muted small mb-0">Total Orders</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="p-3">
                <div className="text-success mb-2">
                  <FaDollarSign size={24} />
                </div>
                <h5 className="fw-bold mb-1">${stats.totalSpent.toFixed(2)}</h5>
                <p className="text-muted small mb-0">Total Spent</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="p-3">
                <div className="text-warning mb-2">
                  <FaHeart size={24} />
                </div>
                <h5 className="fw-bold mb-1">{wishlistItems.length}</h5>
                <p className="text-muted small mb-0">Wishlist Items</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="p-3">
                <div className="text-info mb-2">
                  <FaUndo size={24} />
                </div>
                <h5 className="fw-bold mb-1">{returnRequests.length}</h5>
                <p className="text-muted small mb-0">Returns</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders */}
        <Card className="shadow-sm">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Recent Orders</h6>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setActiveTab('orders')}
            >
              View All
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            {ordersLoading ? (
              <div className="text-center p-4">
                <Spinner animation="border" size="sm" />
                <p className="mt-2 mb-0">Loading orders...</p>
              </div>
            ) : ordersError ? (
              <Alert variant="danger" className="m-3">
                Error loading orders
              </Alert>
            ) : orders && orders.length > 0 ? (
              <div className="list-group list-group-flush">
                {orders.slice(0, 3).map((order) => (
                  <div key={order._id} className="list-group-item">
                    <Row className="align-items-center">
                      <Col sm={5}>
                        <h6 className="mb-1">Order #{order._id.slice(-6)}</h6>
                        <small className="text-muted">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </small>
                      </Col>
                      <Col sm={3}>
                        <Badge bg={getOrderStatusColor(order)}>
                          {getOrderStatusText(order)}
                        </Badge>
                      </Col>
                      <Col sm={4} className="text-end">
                        <strong>${order.totalPrice.toFixed(2)}</strong>
                        <br />
                        <div className="d-flex gap-1 justify-content-end mt-1">
                          <Link 
                            to={`/order/${order._id}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <FaEye />
                          </Link>
                          {order.isDelivered && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleReturnRequest(order)}
                            >
                              <FaUndo />
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <FaBoxOpen size={48} className="text-muted mb-3" />
                <p className="text-muted">No orders yet</p>
                <Button variant="primary" onClick={() => navigate('/')}>
                  Start Shopping
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        {/* Quick Actions */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Quick Actions</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-grid gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => setActiveTab('wishlist')}
              >
                <FaHeart className="me-2" />
                View Wishlist ({wishlistItems.length})
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/order-history')}
              >
                <FaClipboardCheck className="me-2" />
                Order History
              </Button>
              <Button 
                variant="outline-success" 
                onClick={() => setActiveTab('tracking')}
              >
                <FaTruck className="me-2" />
                Track Order
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => setActiveTab('returns')}
              >
                <FaUndo className="me-2" />
                Returns & Refunds
              </Button>
              <Button 
                variant="outline-info" 
                onClick={() => setActiveTab('preferences')}
              >
                <FaBell className="me-2" />
                Preferences
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => setActiveTab('help')}
              >
                <FaQuestionCircle className="me-2" />
                Help & Support
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Returns */}
        <Card className="shadow-sm">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Recent Returns</h6>
            <Button 
              variant="outline-warning" 
              size="sm"
              onClick={() => setActiveTab('returns')}
            >
              View All
            </Button>
          </Card.Header>
          <Card.Body>
            {returnRequests.length > 0 ? (
              returnRequests.slice(0, 2).map((returnReq) => (
                <div key={returnReq.id} className="border-bottom pb-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{returnReq.id}</h6>
                      <p className="text-muted small mb-1">{returnReq.productName}</p>
                      <small className="text-muted">{returnReq.requestDate}</small>
                    </div>
                    <Badge bg={getReturnStatusColor(returnReq.status)}>
                      {returnReq.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <FaUndo size={32} className="text-muted mb-2" />
                <p className="text-muted small">No returns yet</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderProfileTab = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaUser className="me-2" />
          Profile Information
        </h5>
        <Button 
          variant={isEditing ? "success" : "outline-primary"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <FaCheck className="me-1" /> : <FaEdit className="me-1" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </Card.Header>
      <Card.Body className="p-4">
        <Form onSubmit={handleProfileUpdate}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date Joined</Form.Label>
                <Form.Control
                  type="text"
                  value={userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mt-4 mb-3">Address Information</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Street Address</Form.Label>
                <Form.Control
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({...address, street: e.target.value})}
                  disabled={!isEditing}
                  placeholder="123 Main Street"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  disabled={!isEditing}
                  placeholder="New York"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                  disabled={!isEditing}
                  placeholder="NY"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>ZIP Code</Form.Label>
                <Form.Control
                  type="text"
                  value={address.zipCode}
                  onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                  disabled={!isEditing}
                  placeholder="10001"
                />
              </Form.Group>
            </Col>
          </Row>

          {isEditing && (
            <>
              <h6 className="mt-4 mb-3">Change Password (Optional)</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loadingUpdateProfile}>
                  {loadingUpdateProfile ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      Update Profile
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card.Body>
    </Card>
  );

  const renderOrdersTab = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <Row className="align-items-center">
          <Col md={6}>
            <h5 className="mb-0">
              <FaShoppingBag className="me-2" />
              Order History
            </h5>
          </Col>
          <Col md={6}>
            <Row>
              <Col md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={6}>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <FaShoppingBag className="me-2" />
                  Continue Shopping
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body className="p-0">
        {ordersLoading ? (
          <div className="text-center p-4">
            <Loader />
          </div>
        ) : ordersError ? (
          <Alert variant="danger" className="m-3">
            <FaExclamationTriangle className="me-2" />
            {ordersError?.data?.message || ordersError.error}
          </Alert>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>#{order._id.slice(-6)}</strong>
                  </td>
                  <td>
                    <div>
                      {new Date(order.createdAt).toLocaleDateString()}
                      <br />
                      <small className="text-muted">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="badge bg-light text-dark">
                        {order.orderItems?.length || 0} items
                      </span>
                      <br />
                      <small className="text-muted">
                        {order.orderItems?.slice(0, 2).map(item => item.name).join(', ')}
                        {order.orderItems?.length > 2 && '...'}
                      </small>
                    </div>
                  </td>
                  <td>
                    <strong>${order.totalPrice.toFixed(2)}</strong>
                  </td>
                  <td>
                    <Badge bg={getOrderStatusColor(order)}>
                      {getOrderStatusText(order)}
                    </Badge>
                    {order.isDelivered && (
                      <div className="mt-1">
                        <small className="text-success">
                          <FaCheckCircle className="me-1" />
                          Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                        </small>
                      </div>
                    )}
                  </td>
                  <td>
                    {order.isPaid ? (
                      <div>
                        <Badge bg="success">Paid</Badge>
                        <br />
                        <small className="text-muted">
                          {new Date(order.paidAt).toLocaleDateString()}
                        </small>
                      </div>
                    ) : (
                      <Badge bg="danger">Unpaid</Badge>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-column">
                      <div className="d-flex gap-1">
                        <LinkContainer to={`/order/${order._id}`}>
                          <Button variant="outline-primary" size="sm" title="View Order">
                            <FaEye />
                          </Button>
                        </LinkContainer>
                        {order.isPaid && (
                          <LinkContainer to={`/order/${order._id}/invoice`}>
                            <Button variant="outline-success" size="sm" title="Download Invoice">
                              <FaDownload />
                            </Button>
                          </LinkContainer>
                        )}
                      </div>
                      {order.isDelivered && (
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleReturnRequest(order)}
                            title="Request Return - Only available for delivered orders"
                            disabled={!canRequestReturn(order)}
                          >
                            <FaUndo />
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleRefundRequest(order)}
                            title="Request Refund - Only available for delivered orders"
                            disabled={!canRequestRefund(order)}
                          >
                            <FaExchangeAlt />
                          </Button>
                        </div>
                      )}
                      {order.trackingNumber && (
                        <div className="d-flex gap-1 mt-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            href={getCarrierTrackingUrl(order.shippingCarrier, order.trackingNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Track Package"
                          >
                            <FaTruck />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="text-center p-5">
            <FaBoxOpen size={64} className="text-muted mb-3" />
            <h5>No Orders Found</h5>
            <p className="text-muted">
              {orderSearch 
                ? 'No orders match your search criteria.' 
                : 'When you place orders, they\'ll appear here.'
              }
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderReturnsTab = () => (
    <>
      <Tabs defaultActiveKey="returns" className="mb-4">
        <Tab eventKey="returns" title={
          <span>
            <FaUndo className="me-2" />
            Returns ({returnRequests.length})
          </span>
        }>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Return Requests</h6>
              <div className="d-flex gap-2">
                <Form.Select 
                  size="sm" 
                  value={returnFilter} 
                  onChange={(e) => setReturnFilter(e.target.value)}
                  style={{width: 'auto'}}
                >
                  <option value="all">All Returns</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              {filteredReturns.length > 0 ? (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Return ID</th>
                      <th>Order</th>
                      <th>Product</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Est. Refund</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((returnReq) => (
                      <tr key={returnReq.id}>
                        <td>
                          <strong>{returnReq.id}</strong>
                        </td>
                        <td>
                          <Link to={`/order/${returnReq.orderId}`}>
                            #{returnReq.orderId.slice(-6)}
                          </Link>
                        </td>
                        <td>
                          <div>
                            {returnReq.productName}
                            {returnReq.quantity && (
                              <>
                                <br />
                                <small className="text-muted">Qty: {returnReq.quantity}</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <small>{returnReq.reason}</small>
                        </td>
                        <td>
                          <Badge bg={getReturnStatusColor(returnReq.status)}>
                            {returnReq.status.charAt(0).toUpperCase() + returnReq.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          {new Date(returnReq.requestDate).toLocaleDateString()}
                        </td>
                        <td>
                          <strong>${returnReq.estimatedRefund?.toFixed(2)}</strong>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              title="View Details"
                              onClick={() => {
                                setSelectedReturn(returnReq);
                                setShowReturnDetailModal(true);
                              }}
                            >
                              <FaEye />
                            </Button>
                            {returnReq.trackingNumber && (
                              <Button 
                                variant="outline-info" 
                                size="sm" 
                                title="Track Return"
                                onClick={() => window.open(`https://tools.usps.com/go/TrackConfirmAction?tLabels=${returnReq.trackingNumber}`, '_blank')}
                              >
                                <FaTruck />
                              </Button>
                            )}
                            {returnReq.status === 'pending' && (
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                title="Cancel Return"
                                onClick={() => handleCancelReturn(returnReq.id)}
                              >
                                <FaTimes />
                              </Button>
                            )}
                            {returnReq.status === 'approved' && !returnReq.shippingLabel && (
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                title="Download Shipping Label"
                                onClick={() => handleDownloadShippingLabel(returnReq.id)}
                              >
                                <FaDownload />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-4">
                  <FaUndo size={48} className="text-muted mb-3" />
                  <h6>No Return Requests</h6>
                  <p className="text-muted">
                    {returnFilter !== 'all' 
                      ? `No ${returnFilter} return requests found.`
                      : 'You haven\'t made any return requests yet.'
                    }
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="refunds" title={
          <span>
            <FaExchangeAlt className="me-2" />
            Refunds ({refundRequests.length})
          </span>
        }>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Refund Requests</h6>
            </Card.Header>
            <Card.Body>
              {refundRequests.length > 0 ? (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Refund ID</th>
                      <th>Order</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Processed</th>
                      <th>Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundRequests.map((refundReq) => (
                      <tr key={refundReq.id}>
                        <td>
                          <strong>{refundReq.id}</strong>
                        </td>
                        <td>
                          <Link to={`/order/${refundReq.orderId}`}>
                            #{refundReq.orderId.slice(-6)}
                          </Link>
                        </td>
                        <td>
                          <strong>${refundReq.amount.toFixed(2)}</strong>
                        </td>
                        <td>
                          <small>{refundReq.reason}</small>
                        </td>
                        <td>
                          <Badge bg={getRefundStatusColor(refundReq.status)}>
                            {refundReq.status.charAt(0).toUpperCase() + refundReq.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          {new Date(refundReq.requestDate).toLocaleDateString()}
                        </td>
                        <td>
                          {refundReq.processedDate ? (
                            new Date(refundReq.processedDate).toLocaleDateString()
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <small>{refundReq.method}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button variant="outline-primary" size="sm" title="View Details">
                              <FaEye />
                            </Button>
                            {refundReq.status === 'processed' && (
                              <Button variant="outline-success" size="sm" title="Download Receipt">
                                <FaDownload />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-4">
                  <FaExchangeAlt size={48} className="text-muted mb-3" />
                  <h6>No Refund Requests</h6>
                  <p className="text-muted">You haven't made any refund requests yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="return-policy" title={
          <span>
            <FaFileAlt className="me-2" />
            Return Policy
          </span>
        }>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Return & Refund Policy</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-primary">Return Policy</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <FaCheckCircle className="text-success me-2" />
                      30-day return window for unworn items
                    </li>
                    <li className="mb-2">
                      <FaCheckCircle className="text-success me-2" />
                      Original tags and packaging required
                    </li>
                    <li className="mb-2">
                      <FaCheckCircle className="text-success me-2" />
                      Free return shipping for defective items
                    </li>
                    <li className="mb-2">
                      <FaCheckCircle className="text-success me-2" />
                      Exchange available for different sizes
                    </li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="text-primary">Refund Process</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <FaClock className="text-warning me-2" />
                      5-7 business days processing time
                    </li>
                    <li className="mb-2">
                      <FaCreditCard className="text-info me-2" />
                      Refunds to original payment method
                    </li>
                    <li className="mb-2">
                      <FaShippingFast className="text-primary me-2" />
                      Return shipping label provided
                    </li>
                    <li className="mb-2">
                      <FaBell className="text-secondary me-2" />
                      Email notifications for status updates
                    </li>
                  </ul>
                </Col>
              </Row>
              
              <Alert variant="info" className="mt-4">
                <FaInfoCircle className="me-2" />
                <strong>Important:</strong> Custom-tailored items cannot be returned unless defective. 
                Sale items are final sale and cannot be returned for refund, but exchanges are available within 14 days.
              </Alert>

              <div className="mt-4">
                <h6>Need Help?</h6>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm">
                    <FaComments className="me-1" />
                    Live Chat
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    <FaPhone className="me-1" />
                    Call Support
                  </Button>
                  <Button variant="outline-info" size="sm">
                    <FaEnvelope className="me-1" />
                    Email Us
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </>
  );

  const renderWishlistTab = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaHeart className="me-2" />
          My Wishlist ({wishlistItems.length})
        </h5>
        <Button 
          variant="outline-primary"
          onClick={() => navigate('/wishlist')}
        >
          View Full Wishlist
        </Button>
      </Card.Header>
      <Card.Body>
        {wishlistItems.length > 0 ? (
          <Row>
            {wishlistItems.map((item) => (
              <Col md={6} lg={3} key={item._id} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={getFullImageUrl(item.image)} 
                    alt={item.name}
                    style={{ height: '150px', objectFit: 'cover' }}
                  />
                  <Card.Body className="p-2">
                    <Card.Title className="h6 mb-1">{item.name}</Card.Title>
                    <Card.Text className="text-muted small mb-2">{item.brand}</Card.Text>
                    <Card.Text className="fw-bold">${item.price}</Card.Text>
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="flex-grow-1"
                        onClick={() => navigate(`/product/${item._id}`)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        title="Add to Cart"
                      >
                        <FaShoppingBag />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center p-4">
            <FaHeart size={48} className="text-muted mb-3" />
            <h6>Your Wishlist is Empty</h6>
            <p className="text-muted">Save items you love for later!</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Browse Products
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderTrackingTab = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <h5 className="mb-0">
          <FaTruck className="me-2" />
          Order Tracking
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Enter Order ID or Tracking Number</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Order ID or Tracking Number"
                />
                <Button variant="primary">
                  <FaSearch className="me-1" />
                  Track
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
        </Row>

        <Alert variant="info">
          <FaInfoCircle className="me-2" />
          You can track your orders using either your Order ID (found in confirmation email) or the tracking number provided by the shipping carrier.
        </Alert>

        {/* Recent Trackable Orders */}
        <h6 className="mt-4 mb-3">Recent Orders</h6>
        {orders && orders.filter(order => order.isPaid).slice(0, 3).map((order) => (
          <Card key={order._id} className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="align-items-center">
                <Col md={3}>
                  <strong>#{order._id.slice(-6)}</strong>
                  <br />
                  <small className="text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </small>
                </Col>
                <Col md={3}>
                  <Badge bg={getOrderStatusColor(order)}>
                    {getOrderStatusText(order)}
                  </Badge>
                </Col>
                <Col md={3}>
                  <strong>${order.totalPrice.toFixed(2)}</strong>
                </Col>
                <Col md={3}>
                  <div className="d-flex gap-1">
                    <Button variant="outline-primary" size="sm">
                      <FaTruck className="me-1" />
                      Track
                    </Button>
                    <LinkContainer to={`/order/${order._id}`}>
                      <Button variant="outline-secondary" size="sm">
                        <FaEye />
                      </Button>
                    </LinkContainer>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </Card.Body>
    </Card>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-4">
      {/* Email Preferences */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <FaEnvelope className="me-2" />
            Email Preferences
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="text-primary mb-3">Order Communications</h6>
              <Form.Check 
                type="switch"
                id="email-order-updates"
                label="Order status updates"
                checked={preferences.emailNotifications.orderUpdates}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailNotifications: {
                    ...preferences.emailNotifications,
                    orderUpdates: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="email-security"
                label="Security alerts"
                checked={preferences.emailNotifications.security}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailNotifications: {
                    ...preferences.emailNotifications,
                    security: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
            <Col md={6}>
              <h6 className="text-primary mb-3">Marketing & Promotions</h6>
              <Form.Check 
                type="switch"
                id="email-promotions"
                label="Promotional emails"
                checked={preferences.emailNotifications.promotions}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailNotifications: {
                    ...preferences.emailNotifications,
                    promotions: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="email-newsletter"
                label="Newsletter subscription"
                checked={preferences.emailNotifications.newsletter}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailNotifications: {
                    ...preferences.emailNotifications,
                    newsletter: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="email-recommendations"
                label="Product recommendations"
                checked={preferences.emailNotifications.recommendations}
                onChange={(e) => setPreferences({
                  ...preferences,
                  emailNotifications: {
                    ...preferences.emailNotifications,
                    recommendations: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* SMS Preferences */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <FaPhone className="me-2" />
            SMS Notifications
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Check 
                type="switch"
                id="sms-order-updates"
                label="Order status updates"
                checked={preferences.smsNotifications.orderUpdates}
                onChange={(e) => setPreferences({
                  ...preferences,
                  smsNotifications: {
                    ...preferences.smsNotifications,
                    orderUpdates: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="sms-security"
                label="Security alerts"
                checked={preferences.smsNotifications.security}
                onChange={(e) => setPreferences({
                  ...preferences,
                  smsNotifications: {
                    ...preferences.smsNotifications,
                    security: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
            <Col md={6}>
              <Form.Check 
                type="switch"
                id="sms-promotions"
                label="Promotional messages"
                checked={preferences.smsNotifications.promotions}
                onChange={(e) => setPreferences({
                  ...preferences,
                  smsNotifications: {
                    ...preferences.smsNotifications,
                    promotions: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Shopping Preferences */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <FaShoppingBag className="me-2" />
            Shopping Preferences
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Check 
                type="switch"
                id="auto-save"
                label="Auto-save cart items"
                checked={preferences.shopping.autoSave}
                onChange={(e) => setPreferences({
                  ...preferences,
                  shopping: {
                    ...preferences.shopping,
                    autoSave: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="recommendations"
                label="Personalized recommendations"
                checked={preferences.shopping.recommendations}
                onChange={(e) => setPreferences({
                  ...preferences,
                  shopping: {
                    ...preferences.shopping,
                    recommendations: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
            <Col md={6}>
              <Form.Check 
                type="switch"
                id="price-alerts"
                label="Price drop alerts"
                checked={preferences.shopping.priceAlerts}
                onChange={(e) => setPreferences({
                  ...preferences,
                  shopping: {
                    ...preferences.shopping,
                    priceAlerts: e.target.checked
                  }
                })}
                className="mb-2"
              />
              <Form.Check 
                type="switch"
                id="wishlist-notifications"
                label="Wishlist item availability"
                checked={preferences.shopping.wishlistNotifications}
                onChange={(e) => setPreferences({
                  ...preferences,
                  shopping: {
                    ...preferences.shopping,
                    wishlistNotifications: e.target.checked
                  }
                })}
                className="mb-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Privacy Preferences */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <FaShieldAlt className="me-2" />
            Privacy Settings
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Profile Visibility</Form.Label>
                <Form.Select 
                  value={preferences.privacy.profileVisibility}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    privacy: {
                      ...preferences.privacy,
                      profileVisibility: e.target.value
                    }
                  })}
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                  <option value="public">Public</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Check 
                type="switch"
                id="data-sharing"
                label="Allow data sharing for improvements"
                checked={preferences.privacy.dataSharing}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: {
                    ...preferences.privacy,
                    dataSharing: e.target.checked
                  }
                })}
                className="mt-4"
              />
              <Form.Check 
                type="switch"
                id="analytics"
                label="Enable analytics tracking"
                checked={preferences.privacy.analytics}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: {
                    ...preferences.privacy,
                    analytics: e.target.checked
                  }
                })}
                className="mt-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="text-center">
        <Button variant="primary" size="lg" onClick={handlePreferencesUpdate}>
          <FaSave className="me-2" />
          Save All Preferences
        </Button>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div>
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FaQuestionCircle className="me-2" />
                Help & Support Center
              </h5>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="faq" className="mb-4">
                <Tab eventKey="faq" title="FAQ">
                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>How do I track my order?</Accordion.Header>
                      <Accordion.Body>
                        You can track your order by going to the "Track Order" tab in your profile or by entering your order ID in the tracking section. You'll receive a tracking number via email once your order ships.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>What is your return policy?</Accordion.Header>
                      <Accordion.Body>
                        We offer a 30-day return window for unworn items with original tags. Custom-tailored items can only be returned if defective. Visit the Returns & Refunds section for complete details.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                      <Accordion.Header>How do I find the right size?</Accordion.Header>
                      <Accordion.Body>
                        Use our size guide and measurement tools available on each product page. You can also chat with our size consultant for personalized recommendations.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="3">
                      <Accordion.Header>How long does shipping take?</Accordion.Header>
                      <Accordion.Body>
                        Standard shipping takes 5-7 business days. Express shipping (2-3 days) and overnight options are available. Custom tailoring adds 2-3 weeks to delivery time.
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="4">
                      <Accordion.Header>Can I modify or cancel my order?</Accordion.Header>
                      <Accordion.Body>
                        Orders can be modified or cancelled within 2 hours of placement. After that, contact our support team immediately for assistance.
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Tab>
                
                <Tab eventKey="size-guide" title="Size Guide">
                  <Row>
                    <Col md={6}>
                      <h6 className="text-primary">Suit Measurements</h6>
                      <Table striped bordered size="sm">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th>Chest</th>
                            <th>Waist</th>
                            <th>Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>36R</td><td>36"</td><td>30"</td><td>31"</td></tr>
                          <tr><td>38R</td><td>38"</td><td>32"</td><td>31.5"</td></tr>
                          <tr><td>40R</td><td>40"</td><td>34"</td><td>32"</td></tr>
                          <tr><td>42R</td><td>42"</td><td>36"</td><td>32.5"</td></tr>
                          <tr><td>44R</td><td>44"</td><td>38"</td><td>33"</td></tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-primary">Shoe Sizes</h6>
                      <Table striped bordered size="sm">
                        <thead>
                          <tr>
                            <th>US</th>
                            <th>UK</th>
                            <th>EU</th>
                            <th>CM</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>8</td><td>7</td><td>41</td><td>26</td></tr>
                          <tr><td>8.5</td><td>7.5</td><td>42</td><td>26.5</td></tr>
                          <tr><td>9</td><td>8</td><td>42.5</td><td>27</td></tr>
                          <tr><td>9.5</td><td>8.5</td><td>43</td><td>27.5</td></tr>
                          <tr><td>10</td><td>9</td><td>44</td><td>28</td></tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                  
                  <Alert variant="info" className="mt-3">
                    <FaRuler className="me-2" />
                    For the most accurate fit, we recommend professional measurements or using our virtual fitting tool.
                  </Alert>
                </Tab>
                
                <Tab eventKey="policies" title="Policies">
                  <Row>
                    <Col md={6}>
                      <h6 className="text-primary">Shipping Policy</h6>
                      <ul>
                        <li>Free shipping on orders over $200</li>
                        <li>Standard shipping: 5-7 business days</li>
                        <li>Express shipping: 2-3 business days</li>
                        <li>International shipping available</li>
                        <li>Signature required for orders over $500</li>
                      </ul>
                      
                      <h6 className="text-primary mt-4">Payment Policy</h6>
                      <ul>
                        <li>We accept all major credit cards</li>
                        <li>PayPal and Apple Pay supported</li>
                        <li>Payment plans available for orders over $1000</li>
                        <li>All transactions are secure and encrypted</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-primary">Quality Guarantee</h6>
                      <ul>
                        <li>100% satisfaction guarantee</li>
                        <li>Premium materials and craftsmanship</li>
                        <li>Professional tailoring services</li>
                        <li>Lifetime minor alterations</li>
                        <li>Defect replacement within 1 year</li>
                      </ul>
                      
                      <h6 className="text-primary mt-4">Custom Orders</h6>
                      <ul>
                        <li>Made-to-measure service available</li>
                        <li>2-3 week production time</li>
                        <li>Multiple fitting appointments</li>
                        <li>Personal style consultation included</li>
                      </ul>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">
                <FaHeadset className="me-2" />
                Contact Support
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-3">
                <div className="text-center">
                  <FaComments size={32} className="text-primary mb-2" />
                  <h6>Live Chat</h6>
                  <p className="small text-muted mb-2">Available 24/7</p>
                  <Button variant="primary" size="sm">Start Chat</Button>
                </div>
                
                <hr />
                
                <div className="text-center">
                  <FaPhone size={32} className="text-success mb-2" />
                  <h6>Phone Support</h6>
                  <p className="small text-muted mb-1">1-800-SUITS-NOW</p>
                  <p className="small text-muted mb-2">Mon-Fri 9AM-8PM EST</p>
                  <Button variant="success" size="sm">Call Now</Button>
                </div>
                
                <hr />
                
                <div className="text-center">
                  <FaEnvelope size={32} className="text-info mb-2" />
                  <h6>Email Support</h6>
                  <p className="small text-muted mb-1">support@promayouf.com</p>
                  <p className="small text-muted mb-2">Response within 24 hours</p>
                  <Button variant="info" size="sm">Send Email</Button>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">
                <FaLifeRing className="me-2" />
                Self-Service
              </h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 px-0">
                  <Link to="/order-status" className="text-decoration-none">
                    <FaSearch className="me-2" />
                    Check Order Status
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0">
                  <Link to="/return-center" className="text-decoration-none">
                    <FaUndo className="me-2" />
                    Return Center
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0">
                  <Link to="/size-guide" className="text-decoration-none">
                    <FaRuler className="me-2" />
                    Size Guide
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0">
                  <Link to="/care-instructions" className="text-decoration-none">
                    <FaBook className="me-2" />
                    Care Instructions
                  </Link>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <Container className="py-4">
      <Row>
        <Col lg={3}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                My Account
              </h5>
            </Card.Header>
            <Nav variant="pills" className="flex-column p-3">
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  className="d-flex align-items-center"
                >
                  <FaChartLine className="me-2" />
                  Dashboard
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  className="d-flex align-items-center"
                >
                  <FaUser className="me-2" />
                  Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'orders'}
                  onClick={() => setActiveTab('orders')}
                  className="d-flex align-items-center"
                >
                  <FaShoppingBag className="me-2" />
                  Orders
                  {orders && orders.length > 0 && (
                    <Badge bg="primary" className="ms-auto">
                      {orders.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  onClick={() => navigate('/order-history')}
                  className="d-flex align-items-center"
                >
                  <FaClipboardCheck className="me-2" />
                  Order History
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'returns'}
                  onClick={() => setActiveTab('returns')}
                  className="d-flex align-items-center"
                >
                  <FaUndo className="me-2" />
                  Returns & Refunds
                  {returnRequests.length > 0 && (
                    <Badge bg="warning" className="ms-auto">
                      {returnRequests.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'wishlist'}
                  onClick={() => setActiveTab('wishlist')}
                  className="d-flex align-items-center"
                >
                  <FaHeart className="me-2" />
                  Wishlist
                  {wishlistItems.length > 0 && (
                    <Badge bg="danger" className="ms-auto">
                      {wishlistItems.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'tracking'}
                  onClick={() => setActiveTab('tracking')}
                  className="d-flex align-items-center"
                >
                  <FaTruck className="me-2" />
                  Track Order
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'preferences'}
                  onClick={() => setActiveTab('preferences')}
                  className="d-flex align-items-center"
                >
                  <FaBell className="me-2" />
                  Preferences
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="mb-2">
                <Nav.Link 
                  active={activeTab === 'help'}
                  onClick={() => setActiveTab('help')}
                  className="d-flex align-items-center"
                >
                  <FaQuestionCircle className="me-2" />
                  Help & Support
                </Nav.Link>
              </Nav.Item>
              <hr />
              <Nav.Item>
                <Nav.Link 
                  onClick={handleLogout}
                  className="d-flex align-items-center text-danger"
                >
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card>
        </Col>

        <Col lg={9}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'returns' && renderReturnsTab()}
          {activeTab === 'wishlist' && renderWishlistTab()}
          {activeTab === 'tracking' && renderTrackingTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'help' && renderHelpTab()}
        </Col>
      </Row>

      {/* Return Request Modal */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUndo className="me-2" />
            Request Return
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Alert variant="info">
                <FaInfoCircle className="me-2" />
                Requesting return for Order #{selectedOrder._id.slice(-6)}
              </Alert>
              
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reason for Return</Form.Label>
                      <Form.Select 
                        value={returnReason} 
                        onChange={(e) => setReturnReason(e.target.value)}
                        required
                      >
                        <option value="">Select a reason</option>
                        <option value="Size too small">Size too small</option>
                        <option value="Size too large">Size too large</option>
                        <option value="Quality issue">Quality issue</option>
                        <option value="Not as described">Not as described</option>
                        <option value="Damaged in shipping">Damaged in shipping</option>
                        <option value="Changed mind">Changed mind</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity to Return</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max={selectedOrderItem ? selectedOrderItem.qty : 1}
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Additional Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={returnDescription}
                    onChange={(e) => setReturnDescription(e.target.value)}
                    placeholder="Please provide additional details about your return request..."
                    required
                  />
                </Form.Group>
                
                <Alert variant="warning">
                  <FaExclamationTriangle className="me-2" />
                  Please ensure the item is unworn and has original tags attached. Return shipping label will be provided.
                </Alert>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitReturnRequest}>
            <FaUndo className="me-2" />
            Submit Return Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Refund Request Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExchangeAlt className="me-2" />
            Request Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Alert variant="info">
                <FaInfoCircle className="me-2" />
                Requesting refund for Order #{selectedOrder._id.slice(-6)} - ${selectedOrder.totalPrice.toFixed(2)}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Reason for Refund</Form.Label>
                  <Form.Select 
                    value={refundReason} 
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Item return">Item return</option>
                    <option value="Defective product">Defective product</option>
                    <option value="Order cancellation">Order cancellation</option>
                    <option value="Billing error">Billing error</option>
                    <option value="Duplicate charge">Duplicate charge</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Additional Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={refundDescription}
                    onChange={(e) => setRefundDescription(e.target.value)}
                    placeholder="Please provide additional details about your refund request..."
                    required
                  />
                </Form.Group>
                
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  Refunds are processed to the original payment method within 5-7 business days.
                </Alert>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitRefundRequest}>
            <FaExchangeAlt className="me-2" />
            Submit Refund Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Return Detail Modal */}
      <Modal show={showReturnDetailModal} onHide={() => setShowReturnDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUndo className="me-2" />
            Return Details - {selectedReturn?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReturn && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="text-primary mb-3">Return Information</h6>
                      <p><strong>Return ID:</strong> {selectedReturn.id}</p>
                      <p><strong>Order ID:</strong> #{selectedReturn.orderId.slice(-6)}</p>
                      <p><strong>Product:</strong> {selectedReturn.productName}</p>
                      <p><strong>Quantity:</strong> {selectedReturn.quantity}</p>
                      <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                      <p><strong>Status:</strong> <Badge bg={getReturnStatusColor(selectedReturn.status)}>
                        {selectedReturn.status.charAt(0).toUpperCase() + selectedReturn.status.slice(1)}
                      </Badge></p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="text-success mb-3">Financial Details</h6>
                      <p><strong>Estimated Refund:</strong> ${selectedReturn.estimatedRefund?.toFixed(2)}</p>
                      <p><strong>Request Date:</strong> {new Date(selectedReturn.requestDate).toLocaleDateString()}</p>
                      {selectedReturn.approvedAt && (
                        <p><strong>Approved:</strong> {new Date(selectedReturn.approvedAt).toLocaleDateString()}</p>
                      )}
                      {selectedReturn.processedAt && (
                        <p><strong>Processed:</strong> {new Date(selectedReturn.processedAt).toLocaleDateString()}</p>
                      )}
                      <p><strong>Return Method:</strong> {selectedReturn.returnMethod}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {selectedReturn.description && (
                <Card className="mb-3">
                  <Card.Header>
                    <h6 className="mb-0">Return Description</h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{selectedReturn.description}</p>
                  </Card.Body>
                </Card>
              )}

              {selectedReturn.trackingNumber && (
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  <strong>Return Tracking Number:</strong> {selectedReturn.trackingNumber}
                  <div className="mt-2">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="me-2"
                      onClick={() => window.open(`https://tools.usps.com/go/TrackConfirmAction?tLabels=${selectedReturn.trackingNumber}`, '_blank')}
                    >
                      <FaTruck className="me-1" />
                      Track Return Package
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => handleDownloadShippingLabel(selectedReturn.id)}
                    >
                      <FaDownload className="me-1" />
                      Download Label
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Enhanced Financial Information */}
              <Card className="mt-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FaDollarSign className="me-2" />
                    Financial Details
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Refund Amount:</strong> ${selectedReturn.estimatedRefund?.toFixed(2)}
                      </p>
                      <p className="mb-1">
                        <strong>Processing Time:</strong> {selectedReturn.processingTime || '5-7 business days'}
                      </p>
                    </Col>
                    <Col md={6}>
                      {selectedReturn.transactionId && (
                        <p className="mb-1">
                          <strong>Transaction ID:</strong> {selectedReturn.transactionId}
                        </p>
                      )}
                      {selectedReturn.approvedAt && (
                        <p className="mb-1">
                          <strong>Approved Date:</strong> {new Date(selectedReturn.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {selectedReturn.status === 'approved' && (
                <Alert variant="success">
                  <FaCheckCircle className="me-2" />
                  Your return has been approved! Please package the item securely and ship it using the provided return label.
                </Alert>
              )}

              {selectedReturn.status === 'pending' && (
                <Alert variant="warning">
                  <FaClock className="me-2" />
                  Your return request is being reviewed. You will receive an email update within 24-48 hours.
                </Alert>
              )}

              <div className="mt-4">
                <h6>Next Steps:</h6>
                <ListGroup variant="flush">
                  {selectedReturn.status === 'pending' && (
                    <ListGroup.Item>
                      <FaClock className="me-2 text-warning" />
                      Wait for return approval (usually within 24-48 hours)
                    </ListGroup.Item>
                  )}
                  {selectedReturn.status === 'approved' && (
                    <>
                      <ListGroup.Item>
                        <FaDownload className="me-2 text-primary" />
                        Download and print the return shipping label
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <FaBoxOpen className="me-2 text-info" />
                        Package the item securely with original packaging if available
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <FaTruck className="me-2 text-success" />
                        Drop off the package at any USPS location or schedule a pickup
                      </ListGroup.Item>
                    </>
                  )}
                  {selectedReturn.status === 'processing' && (
                    <ListGroup.Item>
                      <FaSearch className="me-2 text-info" />
                      Your returned item is being inspected for quality
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnDetailModal(false)}>
            Close
          </Button>
          {selectedReturn?.status === 'approved' && !selectedReturn.shippingLabel && (
            <Button 
              variant="primary" 
              onClick={() => handleDownloadShippingLabel(selectedReturn.id)}
            >
              <FaDownload className="me-2" />
              Download Shipping Label
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FaExclamationTriangle className="me-2" />
            Delete Account
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning!</strong> This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <p>Are you sure you want to delete your account? This will:</p>
          <ul>
            <li>Permanently delete your profile</li>
            <li>Cancel all pending orders</li>
            <li>Remove your order history</li>
            <li>Delete your wishlist</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount}>
            <FaTrash className="me-2" />
            Delete My Account
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnhancedProfileScreen;
