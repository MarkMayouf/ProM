import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';

const FlashSale = ({ endTime, products }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flash-sale-container my-4">
      <div className="flash-sale-header d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          <FaClock className="me-2" />
          Flash Sale
        </h2>
        <div className="flash-sale-timer">
          {timeLeft.hours || timeLeft.minutes || timeLeft.seconds ? (
            <span>
              Ends in: {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          ) : (
            <span>Sale Ended!</span>
          )}
        </div>
      </div>

      <Row>
        {products.map((product) => (
          <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
            <Card className="flash-sale-card">
              <div className="sale-badge">
                {Math.round(
                  ((product.regularPrice - product.price) / product.regularPrice) * 100
                )}
                % OFF
              </div>
              <Link to={`/product/${product._id}`}>
                <Card.Img src={product.image} variant="top" />
              </Link>
              <Card.Body>
                <Link to={`/product/${product._id}`}>
                  <Card.Title as="div">{product.name}</Card.Title>
                </Link>
                <Card.Text as="div">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-danger h4">${product.price}</span>
                      <small className="text-muted text-decoration-line-through ms-2">
                        ${product.regularPrice}
                      </small>
                    </div>
                    <Button variant="primary" size="sm">
                      Shop Now
                    </Button>
                  </div>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FlashSale; 