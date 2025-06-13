import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { FaRuler, FaTshirt, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import '../assets/styles/suit-customizer.css';

const SuitCustomizer = ({ 
  show, 
  onHide, 
  product, 
  onAddToCart,
  selectedSize,
  setSelectedSize,
  existingCustomizations = null
}) => {
  const [waistAdjustment, setWaistAdjustment] = useState(0);
  const [lengthAdjustment, setLengthAdjustment] = useState(0);
  const [fitType, setFitType] = useState('slim-fit');
  const [alterationCost, setAlterationCost] = useState(0);
  const [totalPrice, setTotalPrice] = useState(product?.price || 0);

  // Load existing customizations if provided
  useEffect(() => {
    if (existingCustomizations) {
      setWaistAdjustment(existingCustomizations.waistAdjustment || 0);
      setLengthAdjustment(existingCustomizations.lengthAdjustment || 0);
      setFitType(existingCustomizations.fitType || 'slim-fit');
    }
  }, [existingCustomizations]);

  // Alteration pricing
  const alterationPricing = {
    waist: {
      perInch: 15, // $15 per inch for waist adjustment
      maxAdjustment: 4, // Maximum 4 inches
      description: 'Waist adjustment (taking in or letting out)'
    },
    length: {
      perInch: 12, // $12 per inch for length adjustment
      maxAdjustment: 3, // Maximum 3 inches
      description: 'Trouser length adjustment'
    },
    fitType: {
      'slim-fit': 0,
      'regular-fit': 0,
      'classic-fit': 25, // $25 extra for classic fit alterations
      'modern-fit': 15   // $15 extra for modern fit alterations
    }
  };

  // Calculate alteration cost
  useEffect(() => {
    let cost = 0;
    
    // Waist adjustment cost
    if (Math.abs(waistAdjustment) > 0) {
      cost += Math.abs(waistAdjustment) * alterationPricing.waist.perInch;
    }
    
    // Length adjustment cost
    if (Math.abs(lengthAdjustment) > 0) {
      cost += Math.abs(lengthAdjustment) * alterationPricing.length.perInch;
    }
    
    // Fit type cost
    cost += alterationPricing.fitType[fitType] || 0;
    
    setAlterationCost(cost);
    setTotalPrice((product?.price || 0) + cost);
  }, [waistAdjustment, lengthAdjustment, fitType, product?.price]);

  const handleAddToCart = () => {
    const customizations = {
      waistAdjustment: waistAdjustment,
      lengthAdjustment: lengthAdjustment,
      fitType: fitType,
      alterationCost: alterationCost,
      totalPrice: totalPrice
    };

    onAddToCart({
      ...product,
      selectedSize,
      customizations,
      tailoringCost: alterationCost,
      qty: 1
    });
    
    onHide();
  };

  const resetCustomizations = () => {
    setWaistAdjustment(0);
    setLengthAdjustment(0);
    setFitType('slim-fit');
    setAlterationCost(0);
    setTotalPrice(product?.price || 0);
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="suit-customizer-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaTshirt className="me-2" />
          Customize Your Suit
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Row>
          {/* Product Info */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Img 
                variant="top" 
                src={product.image} 
                alt={product.name}
                className="customizer-product-image"
                style={{ height: '300px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text className="text-muted">
                  {product.description}
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="h5 mb-0">Base Price: ${product.price}</span>
                  <Badge bg="primary">{product.brand}</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Customization Options */}
          <Col md={6}>
            <div className="customization-panel">
              <h5>
                <FaRuler className="me-2" />
                Tailoring Options
              </h5>

              {/* Size Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select Size</Form.Label>
                <Form.Select 
                  value={selectedSize} 
                  onChange={(e) => setSelectedSize(e.target.value)}
                  required
                >
                  <option value="">Choose a size...</option>
                  {product.sizes?.map((sizeObj, index) => (
                    <option key={index} value={sizeObj.size}>
                      {sizeObj.size} {sizeObj.quantity > 0 ? `(${sizeObj.quantity} available)` : '(Out of stock)'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Fit Type Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Fit Type</Form.Label>
                <div className="fit-type-container">
                  <Form.Select 
                    value={fitType} 
                    onChange={(e) => setFitType(e.target.value)}
                  >
                    <option value="slim-fit">Slim Fit (No extra charge)</option>
                    <option value="regular-fit">Regular Fit (No extra charge)</option>
                    <option value="modern-fit">Modern Fit (+$15)</option>
                    <option value="classic-fit">Classic Fit (+$25)</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Different fits may require additional tailoring
                  </Form.Text>
                </div>
              </Form.Group>

              {/* Waist Adjustment */}
              <Form.Group className="mb-3">
                <Form.Label>
                  Waist Adjustment (inches)
                  <FaInfoCircle 
                    className="ms-1 info-tooltip" 
                    title="Positive values = let out, Negative values = take in"
                  />
                </Form.Label>
                <div className="adjustment-control">
                  <div className="adjustment-buttons">
                    <Button 
                      className="adjustment-btn"
                      onClick={() => setWaistAdjustment(Math.max(-4, waistAdjustment - 0.5))}
                      disabled={waistAdjustment <= -4}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      value={waistAdjustment}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= -4 && value <= 4) {
                          setWaistAdjustment(value);
                        }
                      }}
                      min="-4"
                      max="4"
                      step="0.5"
                      className="adjustment-input"
                    />
                    <Button 
                      className="adjustment-btn"
                      onClick={() => setWaistAdjustment(Math.min(4, waistAdjustment + 0.5))}
                      disabled={waistAdjustment >= 4}
                    >
                      +
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Range: -4 to +4 inches (${alterationPricing.waist.perInch}/inch)
                  </Form.Text>
                  {Math.abs(waistAdjustment) > 0 && (
                    <div className="alteration-cost waist">
                      <strong>Waist adjustment cost: ${Math.abs(waistAdjustment) * alterationPricing.waist.perInch}</strong>
                    </div>
                  )}
                </div>
              </Form.Group>

              {/* Length Adjustment */}
              <Form.Group className="mb-3">
                <Form.Label>
                  Trouser Length Adjustment (inches)
                  <FaInfoCircle 
                    className="ms-1 info-tooltip" 
                    title="Positive values = lengthen, Negative values = shorten"
                  />
                </Form.Label>
                <div className="adjustment-control">
                  <div className="adjustment-buttons">
                    <Button 
                      className="adjustment-btn"
                      onClick={() => setLengthAdjustment(Math.max(-3, lengthAdjustment - 0.5))}
                      disabled={lengthAdjustment <= -3}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      value={lengthAdjustment}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= -3 && value <= 3) {
                          setLengthAdjustment(value);
                        }
                      }}
                      min="-3"
                      max="3"
                      step="0.5"
                      className="adjustment-input"
                    />
                    <Button 
                      className="adjustment-btn"
                      onClick={() => setLengthAdjustment(Math.min(3, lengthAdjustment + 0.5))}
                      disabled={lengthAdjustment >= 3}
                    >
                      +
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Range: -3 to +3 inches (${alterationPricing.length.perInch}/inch)
                  </Form.Text>
                  {Math.abs(lengthAdjustment) > 0 && (
                    <div className="alteration-cost length">
                      <strong>Length adjustment cost: ${Math.abs(lengthAdjustment) * alterationPricing.length.perInch}</strong>
                    </div>
                  )}
                </div>
              </Form.Group>

              {/* Price Summary */}
              <Card className="price-summary-card">
                <Card.Body>
                  <h6>
                    <FaDollarSign className="me-1" />
                    Price Summary
                  </h6>
                  <div className="price-row">
                    <span>Base Price:</span>
                    <span>${product.price}</span>
                  </div>
                  {alterationCost > 0 && (
                    <div className="price-row">
                      <span className="price-highlight">Alteration Cost:</span>
                      <span className="price-highlight">+${alterationCost}</span>
                    </div>
                  )}
                  <div className="price-row total">
                    <span>Total Price:</span>
                    <span>${totalPrice}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Alteration Info */}
              {alterationCost > 0 && (
                <Alert variant="info" className="customizer-alert">
                  <FaInfoCircle className="me-2" />
                  <strong>Tailoring Timeline:</strong> Custom alterations typically take 7-10 business days.
                  You'll receive an email confirmation with pickup details.
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={resetCustomizations}
          className="customizer-btn customizer-btn-outline"
        >
          Reset Customizations
        </Button>
        <Button 
          variant="secondary" 
          onClick={onHide}
          className="customizer-btn customizer-btn-secondary"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className="customizer-btn customizer-btn-primary"
        >
          Add to Cart - ${totalPrice}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SuitCustomizer;
