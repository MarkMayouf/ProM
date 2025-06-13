import React, { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useEmailNotifications } from '../hooks/useEmailNotifications';

const EmailTestPanel = () => {
  const [selectedEmailType, setSelectedEmailType] = useState('purchase-receipt');
  const [testOrderId, setTestOrderId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [testResults, setTestResults] = useState([]);
  
  const {
    sendPurchaseReceipt,
    sendDeliveryFeedback,
    sendOrderStatusUpdate,
    isLoading,
    error
  } = useEmailNotifications();

  const emailTypes = [
    {
      value: 'purchase-receipt',
      label: 'Purchase Receipt',
      description: 'Send order confirmation email',
      icon: '🧾',
      requiresOrder: true
    },
    {
      value: 'delivery-feedback',
      label: 'Delivery Feedback',
      description: 'Request customer feedback after delivery',
      icon: '📦',
      requiresOrder: true
    },
    {
      value: 'order-status',
      label: 'Order Status Update',
      description: 'Notify customer of order status change',
      icon: '🚚',
      requiresOrder: true,
      requiresMessage: true
    }
  ];

  const statusOptions = [
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  const handleSendTestEmail = async () => {
    if (!testOrderId.trim()) {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: 'Please enter a valid Order ID',
        timestamp: new Date().toLocaleTimeString()
      }]);
      return;
    }

    try {
      let result;
      
      switch (selectedEmailType) {
        case 'purchase-receipt':
          result = await sendPurchaseReceipt(testOrderId);
          break;
        case 'delivery-feedback':
          result = await sendDeliveryFeedback(testOrderId);
          break;
        case 'order-status':
          if (!customMessage.trim()) {
            setTestResults(prev => [...prev, {
              type: 'error',
              message: 'Please enter a status message',
              timestamp: new Date().toLocaleTimeString()
            }]);
            return;
          }
          result = await sendOrderStatusUpdate(testOrderId, 'shipped', customMessage);
          break;
        default:
          throw new Error('Invalid email type selected');
      }

      if (result.success) {
        setTestResults(prev => [...prev, {
          type: 'success',
          message: `${emailTypes.find(t => t.value === selectedEmailType)?.label} email sent successfully!`,
          timestamp: new Date().toLocaleTimeString(),
          details: result.data
        }]);
      } else {
        setTestResults(prev => [...prev, {
          type: 'error',
          message: result.error || 'Failed to send email',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const selectedType = emailTypes.find(type => type.value === selectedEmailType);

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #1a2c42, #2c4a6b)' }}>
        <h5 className="mb-0 text-white">
          <FaEnvelope className="me-2" />
          Email Testing Panel
        </h5>
      </Card.Header>
      <Card.Body className="p-4">
        <Alert variant="info" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Admin Tool:</strong> Use this panel to test email functionality with real order data.
        </Alert>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email Type</Form.Label>
              <Form.Select
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value)}
              >
                {emailTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {selectedType?.description}
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Order ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter order ID (e.g., 507f1f77bcf86cd799439011)"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
              />
              <Form.Text className="text-muted">
                Must be a valid order ID from the database
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {selectedEmailType === 'order-status' && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Custom Message (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter a custom message for the status update..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </Form.Group>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button
            onClick={handleSendTestEmail}
            disabled={isLoading || !testOrderId.trim()}
            style={{
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              border: 'none',
              padding: '10px 25px',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            <FaPaperPlane className="me-2" />
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </Button>
          
          {testResults.length > 0 && (
            <Button variant="outline-secondary" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {testResults.length > 0 && (
          <div>
            <h6 className="text-primary mb-3">Test Results</h6>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {testResults.map((result, index) => (
                <Alert
                  key={index}
                  variant={result.type === 'success' ? 'success' : 'danger'}
                  className="mb-2 d-flex align-items-start"
                >
                  <div className="me-2 mt-1">
                    {result.type === 'success' ? (
                      <FaCheckCircle />
                    ) : (
                      <FaExclamationTriangle />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <span>{result.message}</span>
                      <Badge bg="light" text="dark" className="ms-2">
                        {result.timestamp}
                      </Badge>
                    </div>
                    {result.details && (
                      <small className="text-muted d-block mt-1">
                        Sent to: {result.details.sentTo}
                      </small>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="text-primary mb-2">Email Types Overview</h6>
          <Row>
            {emailTypes.map(type => (
              <Col key={type.value} md={4} className="mb-2">
                <div className="d-flex align-items-center">
                  <span className="me-2">{type.icon}</span>
                  <div>
                    <small className="fw-bold d-block">{type.label}</small>
                    <small className="text-muted">{type.description}</small>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        <div className="mt-3 text-center">
          <small className="text-muted">
            <strong>Note:</strong> Emails will be sent to the customer associated with the provided order ID.
            Make sure to use test orders or inform customers when testing.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmailTestPanel; 