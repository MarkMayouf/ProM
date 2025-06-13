import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  ListGroup,
  Badge,
  Form,
  InputGroup,
  Alert,
  ProgressBar,
} from 'react-bootstrap';
import {
  FaBoxOpen,
  FaCheckCircle,
  FaTruck,
  FaWarehouse,
  FaShippingFast,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaEdit,
  FaPlus,
  FaSave,
  FaTrash,
  FaCheck,
  FaHome,
  FaTimesCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * ShippingTracker component - Displays tracking information for an order's shipment
 * @param {Object} order - The order object containing shipment information
 * @param {Boolean} isAdmin - Whether the current user is an admin
 * @param {Function} onUpdateTracking - Callback for updating tracking information
 */
const ShippingTracker = ({ order, isAdmin = false, onUpdateTracking }) => {
  const [editMode, setEditMode] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber || ''
  );
  const [carrier, setCarrier] = useState(order.shippingCarrier || 'FedEx');
  const [shippingStatus, setShippingStatus] = useState(
    order.shippingStatus || 'processing'
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery || ''
  );
  const [events, setEvents] = useState(order.trackingEvents || []);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
  });
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Calculate shipping progress percentage
  const getProgressPercentage = () => {
    const statusMap = {
      'processing': 10,
      'packed': 30,
      'shipped': 60,
      'in_transit': 75,
      'out_for_delivery': 90,
      'delivered': 100,
      'exception': 50,
      'returned': 20,
    };
    return statusMap[shippingStatus] || 0;
  };

  // Get label variant based on status
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

  // Get icon based on status
  const getStatusIcon = (status) => {
    const iconMap = {
      'processing': <FaBoxOpen />,
      'packed': <FaWarehouse />,
      'shipped': <FaTruck />,
      'in_transit': <FaShippingFast />,
      'out_for_delivery': <FaTruck />,
      'delivered': <FaCheckCircle />,
      'exception': <FaExclamationTriangle />,
      'returned': <FaTimesCircle />,
    };
    return iconMap[status] || <FaTruck />;
  };

  // Format status text for display
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle saving tracking information
  const handleSaveTracking = () => {
    const trackingInfo = {
      trackingNumber,
      shippingCarrier: carrier,
      shippingStatus,
      estimatedDelivery,
      trackingEvents: events,
    };

    onUpdateTracking(order._id, trackingInfo);
    setEditMode(false);
  };

  // Handle adding a new tracking event
  const handleAddEvent = () => {
    if (!newEvent.location || !newEvent.description) {
      toast.error('Please complete all fields for the tracking event');
      return;
    }

    const updatedEvents = [
      ...events,
      { ...newEvent, id: Date.now().toString() }
    ];
    
    // Sort events by date (newest first)
    updatedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setEvents(updatedEvents);
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      location: '',
      description: '',
    });
    setShowAddEvent(false);
  };

  // Handle removing a tracking event
  const handleRemoveEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  // Format date for display
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
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaTruck className="me-2" /> Shipping & Tracking Information
        </h5>
        {isAdmin && !editMode && (
          <Button 
            variant="light" 
            size="sm" 
            onClick={() => setEditMode(true)}
          >
            <FaEdit className="me-1" /> Edit Shipping Info
          </Button>
        )}
        {isAdmin && editMode && (
          <Button 
            variant="light" 
            size="sm" 
            onClick={handleSaveTracking}
          >
            <FaSave className="me-1" /> Save Changes
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {/* Order not yet shipped message */}
        {!order.trackingNumber && !editMode && (
          <Alert variant="info">
            <FaExclamationTriangle className="me-2" />
            This order has not been shipped yet. Tracking information will be available once the order is processed.
          </Alert>
        )}

        {/* Shipping Details */}
        <Row className="mb-4">
          <Col md={6}>
            <h6 className="border-bottom pb-2">Tracking Information</h6>
            {editMode ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Tracking Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Shipping Carrier</Form.Label>
                  <Form.Select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                  >
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={shippingStatus}
                    onChange={(e) => setShippingStatus(e.target.value)}
                  >
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="exception">Exception</option>
                    <option value="returned">Returned</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Estimated Delivery Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </Form.Group>
              </>
            ) : (
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Status:</span>
                    <Badge bg={getStatusVariant(shippingStatus)} className="p-2">
                      {getStatusIcon(shippingStatus)}{' '}
                      {formatStatus(shippingStatus)}
                    </Badge>
                  </div>
                </ListGroup.Item>
                {trackingNumber && (
                  <>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Carrier:</span>
                        <span>{carrier}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Tracking Number:</span>
                        <span className="font-monospace">{trackingNumber}</span>
                      </div>
                    </ListGroup.Item>
                    {estimatedDelivery && (
                      <ListGroup.Item>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Estimated Delivery:</span>
                          <span>{new Date(estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                    {carrier && trackingNumber && (
                      <ListGroup.Item>
                        <div className="text-center mt-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`${getCarrierTrackingUrl(carrier, trackingNumber)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaTruck className="me-1" /> Track on {carrier} Website
                          </Button>
                        </div>
                      </ListGroup.Item>
                    )}
                  </>
                )}
              </ListGroup>
            )}
          </Col>
          
          <Col md={6}>
            <h6 className="border-bottom pb-2">Shipping Address</h6>
            <div className="p-3 bg-light rounded">
              <div className="d-flex">
                <FaMapMarkerAlt className="text-primary me-2 mt-1" />
                <div>
                  <p className="mb-1">{order.shippingAddress.address}</p>
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="mb-0">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
            
            {/* Shipping Progress */}
            {trackingNumber && (
              <div className="mt-4">
                <h6 className="border-bottom pb-2">Shipping Progress</h6>
                <ProgressBar 
                  now={getProgressPercentage()} 
                  variant={getStatusVariant(shippingStatus)}
                  className="my-3"
                  style={{ height: '10px', borderRadius: '5px' }}
                />
                <div className="d-flex justify-content-between text-muted small">
                  <span><FaBoxOpen /> Processing</span>
                  <span><FaTruck /> In Transit</span>
                  <span><FaHome /> Delivered</span>
                </div>
              </div>
            )}
          </Col>
        </Row>

        {/* Tracking Timeline */}
        <div className="tracking-timeline mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Tracking History</h6>
            {isAdmin && editMode && (
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowAddEvent(!showAddEvent)}
              >
                {showAddEvent ? (
                  <><FaTimesCircle className="me-1" /> Cancel</>
                ) : (
                  <><FaPlus className="me-1" /> Add Event</>
                )}
              </Button>
            )}
          </div>
          
          {/* Add new event form */}
          {isAdmin && editMode && showAddEvent && (
            <Card className="mb-3 border-primary">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="City, State"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Package status update"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      variant="primary" 
                      className="mb-3 w-100"
                      onClick={handleAddEvent}
                    >
                      <FaPlus className="me-1" /> Add
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
          
          {/* Event Timeline */}
          {events.length > 0 ? (
            <div className="timeline">
              {events.map((event, index) => (
                <div key={event.id || index} className="timeline-item">
                  <div className="timeline-item-content">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-light text-dark">
                        {formatDate(event.date)}
                      </span>
                      {isAdmin && editMode && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveEvent(event.id)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                    <h6 className="mt-2 mb-1">{event.location}</h6>
                    <p className="mb-0">{event.description}</p>
                    <span className="circle" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="light" className="text-center">
              {editMode ? 
                "Add tracking events to provide customers with shipping updates." :
                "No tracking updates available yet."
              }
            </Alert>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// Helper function to get carrier tracking URL
const getCarrierTrackingUrl = (carrier, trackingNumber) => {
  const carriers = {
    'FedEx': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  
  return carriers[carrier] || '#';
};

export default ShippingTracker;

// Add this CSS to your stylesheet or component
/* 
.timeline {
  position: relative;
  margin: 20px 0;
  padding: 0;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18px;
  height: 100%;
  width: 2px;
  background: #e0e0e0;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding-left: 45px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item-content {
  position: relative;
  padding: 15px;
  border-radius: 5px;
  background-color: #f8f9fa;
  border-left: 3px solid #007bff;
}

.timeline-item-content .circle {
  position: absolute;
  top: 20px;
  left: -43px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #007bff;
  border: 2px solid #ffffff;
  z-index: 1;
}
*/
