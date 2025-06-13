import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaEnvelope, FaBell, FaShoppingCart, FaTruck, FaStar, FaGift } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useEmailNotifications } from '../hooks/useEmailNotifications';

const EmailPreferences = ({ userEmail }) => {
  const [preferences, setPreferences] = useState({
    receiptEmails: true,
    deliveryNotifications: true,
    feedbackRequests: true,
    orderUpdates: true,
    promotionalEmails: true,
    newsletterSubscription: true,
    weeklyDeals: false,
    newArrivals: false,
    personalizedRecommendations: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { subscribeToNewsletter, unsubscribeFromNewsletter, isLoading } = useEmailNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    // Load preferences from localStorage (in production, this would come from the backend)
    const savedPreferences = localStorage.getItem('emailPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    
    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('emailPreferences', JSON.stringify(preferences));
      
      // Handle newsletter subscription/unsubscription
      if (preferences.newsletterSubscription) {
        await subscribeToNewsletter(userEmail);
      } else {
        await unsubscribeFromNewsletter(userEmail);
      }
      
      toast.success('Email preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update email preferences');
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const preferenceCategories = [
    {
      title: 'Order Communications',
      icon: <FaShoppingCart className="text-primary" />,
      description: 'Essential emails about your orders',
      preferences: [
        {
          key: 'receiptEmails',
          label: 'Purchase Receipts',
          description: 'Receive email confirmation when your order is placed and paid',
          required: true
        },
        {
          key: 'orderUpdates',
          label: 'Order Status Updates',
          description: 'Get notified when your order status changes (processing, shipped, etc.)',
          required: false
        },
        {
          key: 'deliveryNotifications',
          label: 'Delivery Notifications',
          description: 'Receive confirmation when your order is delivered',
          required: false
        }
      ]
    },
    {
      title: 'Feedback & Reviews',
      icon: <FaStar className="text-warning" />,
      description: 'Help us improve with your feedback',
      preferences: [
        {
          key: 'feedbackRequests',
          label: 'Review Requests',
          description: 'Receive invitations to review products after delivery',
          required: false
        }
      ]
    },
    {
      title: 'Marketing & Promotions',
      icon: <FaGift className="text-success" />,
      description: 'Stay updated with deals and new products',
      preferences: [
        {
          key: 'newsletterSubscription',
          label: 'Newsletter Subscription',
          description: 'Receive our regular newsletter with updates and exclusive content',
          required: false
        },
        {
          key: 'promotionalEmails',
          label: 'Promotional Offers',
          description: 'Get notified about sales, discounts, and special promotions',
          required: false
        },
        {
          key: 'weeklyDeals',
          label: 'Weekly Deals',
          description: 'Receive weekly emails featuring our best deals and discounts',
          required: false
        },
        {
          key: 'newArrivals',
          label: 'New Arrivals',
          description: 'Be the first to know about new products and collections',
          required: false
        },
        {
          key: 'personalizedRecommendations',
          label: 'Personalized Recommendations',
          description: 'Receive product recommendations based on your purchase history',
          required: false
        }
      ]
    }
  ];

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #1a2c42, #2c4a6b)' }}>
        <h5 className="mb-0 text-white">
          <FaEnvelope className="me-2" />
          Email Preferences
        </h5>
      </Card.Header>
      <Card.Body className="p-4">
        <div className="mb-4">
          <p className="text-muted mb-3">
            Customize your email preferences to receive only the communications you want. 
            You can update these settings at any time.
          </p>
          <Alert variant="info" className="d-flex align-items-center">
            <FaBell className="me-2" />
            <small>
              <strong>Email Address:</strong> {userEmail}
            </small>
          </Alert>
        </div>

        {preferenceCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              {category.icon}
              <div className="ms-2">
                <h6 className="mb-0 text-primary">{category.title}</h6>
                <small className="text-muted">{category.description}</small>
              </div>
            </div>

            <div className="ps-4 border-start border-2 border-light">
              {category.preferences.map((pref) => (
                <div key={pref.key} className="mb-3">
                  <div className="d-flex align-items-start">
                    <Form.Check
                      type="switch"
                      id={pref.key}
                      checked={preferences[pref.key]}
                      onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                      disabled={pref.required}
                      className="me-3"
                    />
                    <div className="flex-grow-1">
                      <Form.Label htmlFor={pref.key} className="mb-1 fw-semibold">
                        {pref.label}
                        {pref.required && (
                          <span className="text-danger ms-1" title="Required">*</span>
                        )}
                      </Form.Label>
                      <div className="text-muted small">{pref.description}</div>
                      {pref.required && (
                        <div className="text-warning small mt-1">
                          <em>This email type is required for account functionality</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <hr className="my-4" />

        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">
              Changes will be applied immediately. You can modify these preferences at any time.
            </small>
          </div>
          <Button
            onClick={handleSavePreferences}
            disabled={saving || isLoading}
            style={{
              background: 'linear-gradient(135deg, #1a2c42, #2c4a6b)',
              border: 'none',
              padding: '10px 30px',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            {saving || isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="text-primary mb-2">Email Frequency</h6>
          <Row>
            <Col md={6}>
              <small className="text-muted">
                <strong>Order Communications:</strong> Sent as needed
              </small>
            </Col>
            <Col md={6}>
              <small className="text-muted">
                <strong>Marketing Emails:</strong> 1-3 times per week maximum
              </small>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <small className="text-muted">
                <strong>Newsletter:</strong> Weekly or bi-weekly
              </small>
            </Col>
            <Col md={6}>
              <small className="text-muted">
                <strong>Feedback Requests:</strong> After each delivery
              </small>
            </Col>
          </Row>
        </div>

        <div className="mt-3 text-center">
          <small className="text-muted">
            Need help? Contact us at{' '}
            <a href="mailto:support@promayouf.com" className="text-decoration-none">
              support@promayouf.com
            </a>
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmailPreferences; 