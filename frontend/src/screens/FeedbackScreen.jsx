import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaCamera, FaHeart, FaThumbsUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const FeedbackScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Feedback form state
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [fitRating, setFitRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchOrderDetails();
  }, [orderId, userInfo, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
        
        // Initialize selected items (all selected by default)
        const itemsSelection = {};
        orderData.orderItems.forEach(item => {
          itemsSelection[item._id] = true;
        });
        setSelectedItems(itemsSelection);
      } else {
        setError('Order not found or access denied');
      }
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each photo must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error('Please write at least 10 characters in your review');
      return;
    }

    setSubmitting(true);

    try {
      const feedbackData = {
        orderId,
        overallRating,
        qualityRating,
        fitRating,
        serviceRating,
        reviewText: reviewText.trim(),
        wouldRecommend,
        reviewedItems: Object.keys(selectedItems).filter(id => selectedItems[id]),
        photos: photos.map(photo => photo.preview), // In production, upload to cloud storage
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback! Your review has been submitted.');
        navigate(`/order/${orderId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating, label, size = 24 }) => (
    <div className="star-rating mb-3">
      <Form.Label className="fw-bold text-primary">{label}</Form.Label>
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={size}
            className={`me-1 cursor-pointer ${
              star <= rating ? 'text-warning' : 'text-muted'
            }`}
            onClick={() => setRating(star)}
            style={{ cursor: 'pointer', transition: 'color 0.2s' }}
          />
        ))}
        <span className="ms-2 text-muted">
          {rating > 0 ? `${rating}/5` : 'Click to rate'}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Order not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-primary mb-3">
              Share Your Experience
            </h1>
            <p className="lead text-muted">
              Help other customers by sharing your thoughts about your ProMayouf purchase
            </p>
            <div className="bg-light p-3 rounded">
              <strong>Order #{order._id.slice(-6)}</strong> • 
              Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
            </div>
          </div>

          {/* Order Items */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaHeart className="me-2" />
                Items in Your Order
              </h5>
            </Card.Header>
            <Card.Body>
              {order.orderItems.map((item) => (
                <div key={item._id} className="d-flex align-items-center mb-3 p-3 border rounded">
                  <Form.Check
                    type="checkbox"
                    checked={selectedItems[item._id] || false}
                    onChange={(e) => setSelectedItems(prev => ({
                      ...prev,
                      [item._id]: e.target.checked
                    }))}
                    className="me-3"
                  />
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    className="rounded me-3"
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.name}</h6>
                    <small className="text-muted">
                      Qty: {item.qty} {item.selectedSize && `• Size: ${item.selectedSize}`}
                    </small>
                  </div>
                </div>
              ))}
              <small className="text-muted">
                Select the items you'd like to review (all selected by default)
              </small>
            </Card.Body>
          </Card>

          {/* Feedback Form */}
          <Card className="shadow-sm">
            <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #1a2c42, #2c4a6b)' }}>
              <h5 className="mb-0 text-white">
                <FaThumbsUp className="me-2" />
                Your Feedback
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmitFeedback}>
                {/* Overall Rating */}
                <StarRating
                  rating={overallRating}
                  setRating={setOverallRating}
                  label="Overall Experience"
                  size={32}
                />

                {/* Detailed Ratings */}
                <Row className="mb-4">
                  <Col md={4}>
                    <StarRating
                      rating={qualityRating}
                      setRating={setQualityRating}
                      label="Quality"
                      size={20}
                    />
                  </Col>
                  <Col md={4}>
                    <StarRating
                      rating={fitRating}
                      setRating={setFitRating}
                      label="Fit & Comfort"
                      size={20}
                    />
                  </Col>
                  <Col md={4}>
                    <StarRating
                      rating={serviceRating}
                      setRating={setServiceRating}
                      label="Service"
                      size={20}
                    />
                  </Col>
                </Row>

                {/* Written Review */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-primary">
                    Tell us about your experience
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share details about the quality, fit, style, or anything else that would help other customers..."
                    className="border-2"
                  />
                  <Form.Text className="text-muted">
                    {reviewText.length}/500 characters (minimum 10)
                  </Form.Text>
                </Form.Group>

                {/* Recommendation */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-primary">
                    Would you recommend ProMayouf to others?
                  </Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Yes, I would recommend ProMayouf"
                      name="recommend"
                      checked={wouldRecommend === true}
                      onChange={() => setWouldRecommend(true)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      label="No, I would not recommend ProMayouf"
                      name="recommend"
                      checked={wouldRecommend === false}
                      onChange={() => setWouldRecommend(false)}
                    />
                  </div>
                </Form.Group>

                {/* Photo Upload */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-primary">
                    <FaCamera className="me-2" />
                    Share Photos (Optional)
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="mb-3"
                  />
                  <Form.Text className="text-muted">
                    Upload up to 5 photos (max 5MB each). Show off your style!
                  </Form.Text>
                  
                  {photos.length > 0 && (
                    <div className="mt-3">
                      <Row>
                        {photos.map((photo) => (
                          <Col key={photo.id} xs={6} md={3} className="mb-3">
                            <div className="position-relative">
                              <img
                                src={photo.preview}
                                alt="Preview"
                                className="img-fluid rounded"
                                style={{ height: '100px', objectFit: 'cover', width: '100%' }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-1"
                                onClick={() => removePhoto(photo.id)}
                              >
                                ×
                              </Button>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </Form.Group>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || overallRating === 0}
                    style={{
                      background: 'linear-gradient(135deg, #1a2c42, #2c4a6b)',
                      border: 'none',
                      padding: '12px 40px',
                      borderRadius: '8px',
                      fontWeight: '600',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Thank You Message */}
          <div className="text-center mt-4 p-4 bg-light rounded">
            <h6 className="text-primary mb-2">Thank you for choosing ProMayouf!</h6>
            <p className="text-muted mb-0">
              Your feedback helps us improve and assists other customers in making informed decisions.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default FeedbackScreen; 