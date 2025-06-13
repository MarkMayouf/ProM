import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Row, Col, ListGroup, Image, Card, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaShoppingBag, FaCreditCard, FaMapMarkerAlt, FaCheck, FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaBoxOpen, FaTag, FaTimes } from 'react-icons/fa';
import Message from '../components/Message';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import { useCreateOrderMutation } from '../slices/ordersApiSlice';
import { clearCartItems, applyCouponToCart, clearCouponFromCart } from '../slices/cartSlice';
import { useApplyCouponMutation } from '../slices/couponsApiSlice';

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [orderError, setOrderError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const cart = useSelector((state) => state.cart);
  const { cartItems, itemsPrice, discountedItemsPrice, discountAmount, shippingPrice, taxPrice, totalPrice, appliedCoupon } = cart;

  // Debug: Log cart state and calculations
  console.log('=== CART DEBUG ===');
  console.log('Cart items:', cartItems);
  console.log('Cart itemsPrice:', itemsPrice);
  console.log('Cart totalPrice:', totalPrice);
  
  // Calculate what the itemsPrice should be including customizations
  const calculatedItemsPrice = cartItems.reduce((acc, item) => {
    const itemTotal = item.price * item.qty;
    const customizationCost = 
      item.customizations?.totalCost || 
      item.customizations?.customizationPrice || 
      item.tailoringCost || 
      0;
    console.log(`Item: ${item.name}, Base: ${itemTotal}, Customization: ${customizationCost}`);
    return acc + itemTotal + customizationCost;
  }, 0);
  
  console.log('Calculated itemsPrice should be:', calculatedItemsPrice);
  console.log('Actual cart itemsPrice:', parseFloat(itemsPrice));
  console.log('Difference:', calculatedItemsPrice - parseFloat(itemsPrice));
  console.log('=== END DEBUG ===');

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  // Validate cart items and redirect if needed
  useEffect(() => {
    if (!cart.shippingAddress.address) {
      navigate('/shipping');
      return;
    }
    if (!cart.paymentMethod) {
      navigate('/payment');
      return;
    }
    if (!cartItems.length) {
      navigate('/cart');
      return;
    }

    // Validate cart item data integrity
    const invalidItems = cartItems.filter(item => !item._id || !item.name || !item.price || item.qty <= 0);
    if (invalidItems.length > 0) {
      toast.error('Some items in your cart are invalid. Please try again.');
      navigate('/cart');
      return;
    }
  }, [cart.paymentMethod, cart.shippingAddress.address, cartItems, navigate]);

  // Validate stock availability before placing order
  const validateStock = async () => {
    setIsValidating(true);
    try {
      const stockValidationPromises = cartItems.map(async (item) => {
        const response = await fetch(`/api/products/${item._id}`);
        if (!response.ok) {
          throw new Error(`Product ${item.name} not found`);
        }
        const product = await response.json();

        // Check stock based on product type
        if (product.sizes && product.sizes.length > 0) {
          const sizeInStock = product.sizes.find(s => s.size === item.selectedSize);
          if (!sizeInStock) {
            throw new Error(`Size ${item.selectedSize} not available for ${item.name}`);
          }
          if (sizeInStock.quantity < item.qty) {
            throw new Error(`Only ${sizeInStock.quantity} units available for ${item.name} in size ${item.selectedSize}`);
          }
        } else {
          if (product.countInStock < item.qty) {
            throw new Error(`Only ${product.countInStock} units available for ${item.name}`);
          }
        }
        return true;
      });

      await Promise.all(stockValidationPromises);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const placeOrderHandler = async () => {
    try {
      setOrderError(null);

      // Validate cart data
      if (!cart.shippingAddress.address || !cart.paymentMethod || cartItems.length === 0) {
        toast.error('Please complete all required information');
        return;
      }

      // Validate cart items
      const invalidItems = cartItems.filter(item => !item._id || !item.name || !item.price || item.qty <= 0);
      if (invalidItems.length > 0) {
        toast.error('Some items in your cart are invalid. Please try again.');
        return;
      }

      // Calculate correct prices that match backend logic
      const baseItemsPrice = cartItems.reduce((acc, item) => {
        const itemTotal = item.price * item.qty;
        const customizationCost = parseFloat(
          item.customizations?.totalCost || 
          item.customizations?.customizationPrice || 
          item.tailoringCost || 
          0
        );
        return acc + itemTotal + customizationCost;
      }, 0);

      // Apply discount if coupon exists
      let finalItemsPrice = baseItemsPrice;
      let finalDiscountAmount = 0;
      
      if (cart.appliedCoupon && cart.discountAmount) {
        finalDiscountAmount = parseFloat(cart.discountAmount);
        finalItemsPrice = baseItemsPrice - finalDiscountAmount;
      }

      // Calculate shipping and tax on discounted price (matching backend)
      const correctShippingPrice = finalItemsPrice > 100 ? 0 : 10;
      const correctTaxPrice = finalItemsPrice * 0.15;
      const correctTotalPrice = finalItemsPrice + correctShippingPrice + correctTaxPrice;

      console.log('=== ORDER CALCULATION DEBUG ===');
      console.log('Base itemsPrice (with customizations):', baseItemsPrice);
      console.log('Discount amount:', finalDiscountAmount);
      console.log('Final itemsPrice (after discount):', finalItemsPrice);
      console.log('Correct shippingPrice:', correctShippingPrice);
      console.log('Correct taxPrice:', correctTaxPrice);
      console.log('Correct totalPrice:', correctTotalPrice);
      console.log('=== END ORDER DEBUG ===');

      // Prepare order data with proper number conversions
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          qty: parseInt(item.qty),
          image: item.image,
          price: parseFloat(item.price),
          selectedSize: item.selectedSize,
          customizations: {
            ...item.customizations,
            totalCost: item.customizations?.totalCost ? parseFloat(item.customizations.totalCost) : 0,
            customizationPrice: item.customizations?.customizationPrice ? parseFloat(item.customizations.customizationPrice) : 0
          },
          tailoringCost: item.tailoringCost ? parseFloat(item.tailoringCost) : 0,
        })),
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: parseFloat(baseItemsPrice.toFixed(2)),
        shippingPrice: parseFloat(correctShippingPrice.toFixed(2)),
        taxPrice: parseFloat(correctTaxPrice.toFixed(2)),
        totalPrice: parseFloat(correctTotalPrice.toFixed(2)),
        appliedCoupon: cart.appliedCoupon,
        discountAmount: cart.discountAmount ? parseFloat(cart.discountAmount) : 0,
        discountedItemsPrice: cart.discountedItemsPrice ? parseFloat(cart.discountedItemsPrice) : parseFloat(finalItemsPrice.toFixed(2)),
      };

      console.log('Placing order with data:', orderData);

      const res = await createOrder(orderData).unwrap();
      
      // Only clear cart if payment method is not PayPal (since PayPal needs confirmation)
      // For other payment methods, clear immediately
      if (cart.paymentMethod !== 'PayPal') {
        dispatch(clearCartItems());
      }
      
      // Small delay to ensure cart is cleared before navigation
      setTimeout(() => {
        navigate(`/order/${res._id}`);
      }, 100);
      
      toast.success('Order placed successfully! Your cart has been cleared.');
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMessage = err?.data?.message || err.message || 'An error occurred while placing your order';
      setOrderError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle coupon application with validation
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    try {
      setCouponError('');
      if (!couponCode.trim()) {
        setCouponError('Please enter a coupon code');
        return;
      }

      // Validate coupon code format
      const couponRegex = /^[A-Z0-9_-]{4,15}$/;
      if (!couponRegex.test(couponCode.trim())) {
        setCouponError('Invalid coupon format');
        return;
      }

      const result = await applyCoupon({
        couponCode: couponCode.trim(),
        cartTotal: itemsPrice
      }).unwrap();

      // Validate coupon response
      if (!result || !result.couponCode || typeof result.discountValue !== 'number') {
        throw new Error('Invalid coupon response from server');
      }

      dispatch(applyCouponToCart(result));
      toast.success('Coupon applied successfully');
      setCouponCode('');
    } catch (err) {
      const errorMessage = err?.data?.message || 'Failed to apply coupon';
      setCouponError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Calculate subtotal including customization costs
  const subtotalWithCustomizations = cartItems.reduce((acc, item) => {
    const itemTotal = parseFloat(item.price) * item.qty;
    const customizationCost = parseFloat(
      item.customizations?.totalCost || 
      item.customizations?.customizationPrice || 
      item.tailoringCost || 
      0
    );
    return acc + itemTotal + customizationCost;
  }, 0);

  // Calculate total customization costs for display
  const totalCustomizationCost = cartItems.reduce((acc, item) => {
    const customizationCost = parseFloat(
      item.customizations?.totalCost || 
      item.customizations?.customizationPrice || 
      item.tailoringCost || 
      0
    );
    return acc + customizationCost;
  }, 0);

  // Calculate correct prices for display
  const displayItemsPrice = cartItems.reduce((acc, item) => {
    return acc + (item.price * item.qty);
  }, 0);

  const displayTotalWithCustomizations = displayItemsPrice + totalCustomizationCost;
  
  // Apply discount if coupon is applied
  let discountedPrice = displayTotalWithCustomizations;
  let actualDiscountAmount = 0;
  
  if (cart.appliedCoupon && cart.discountAmount) {
    actualDiscountAmount = parseFloat(cart.discountAmount);
    discountedPrice = displayTotalWithCustomizations - actualDiscountAmount;
  }
  
  // Calculate shipping and tax on the discounted price (matching backend logic)
  const displayShippingPrice = discountedPrice > 100 ? 0 : 10;
  const displayTaxPrice = discountedPrice * 0.15;
  const displayTotalPrice = discountedPrice + displayShippingPrice + displayTaxPrice;

  const handleClearCoupon = () => {
    dispatch(clearCouponFromCart());
    setCouponCode('');
    toast.info('Coupon removed');
  };

  // Add this CSS style
  const styles = {
    orderItem: {
      transition: 'transform 0.2s ease-in-out',
    },
    orderItemHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    },
    checkoutButton: {
      background: 'linear-gradient(to right, #1a2c42, #2c4a6b)',
      borderColor: '#1a2c42',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      fontWeight: '600',
      padding: '12px 20px',
    }
  };

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h2 className="h4 mb-0 d-flex align-items-center">
                <FaBoxOpen className="me-2 text-primary" /> Order Summary
              </h2>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ListGroup variant='flush'>
                    <ListGroup.Item>
                      <h3 className="h5 d-flex align-items-center">
                        <FaMapMarkerAlt className="me-2 text-secondary" /> Shipping
                      </h3>
                      <div className="ps-4 mt-2">
                        <p className="mb-1">
                          <strong>Address:</strong>
                        </p>
                        <p className="mb-0 text-secondary">
                          {cart.shippingAddress.address}, <br />
                          {cart.shippingAddress.city} {cart.shippingAddress.postalCode}, <br />
                          {cart.shippingAddress.country}
                        </p>
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item>
                      <h3 className="h5 d-flex align-items-center">
                        <FaCreditCard className="me-2 text-secondary" /> Payment
                      </h3>
                      <div className="ps-4 mt-2">
                        <p className="mb-0">
                          <strong>Method: </strong>
                          <span className="badge bg-info">{cart.paymentMethod}</span>
                        </p>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Col>

                <Col md={6}>
                  <ListGroup variant='flush'>
                    <ListGroup.Item>
                      <h3 className="h5 d-flex align-items-center">
                        <FaShoppingBag className="me-2 text-secondary" /> Order Details
                      </h3>
                      <div className="ps-4 mt-2">
                        <p className="mb-1">
                          <strong>Items:</strong> {cart.cartItems.reduce((acc, item) => acc + item.qty, 0)}
                        </p>
                        <p className="mb-0">
                          <strong>Order Total:</strong> ${cart.totalPrice}
                        </p>
                      </div>
                    </ListGroup.Item>

                    {cart.appliedCoupon && (
                      <ListGroup.Item>
                        <div className="d-flex align-items-center mb-2">
                          <div className="discount-highlight">
                            <FaTag className="text-success me-2" />
                            <div>
                              <strong>Coupon Applied:</strong> {cart.appliedCoupon.code}
                            </div>
                          </div>
                        </div>
                        <div className="ps-4">
                          <p className="mb-1 text-success fw-bold">
                            You saved: ${cart.discountAmount} {cart.appliedCoupon.discountType === 'percentage' && `(${cart.appliedCoupon.discountValue}% off)`}
                          </p>
                          <div className="savings-breakdown">
                            <div className="d-flex justify-content-between">
                              <span>Original Price:</span>
                              <span className="text-decoration-line-through">${cart.itemsPrice}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Discounted Price:</span>
                              <span className="fw-bold">${cart.discountedItemsPrice}</span>
                            </div>
                          </div>
                          {cart.appliedCoupon.expirationDate && (
                            <p className="coupon-expiry small text-muted">
                              Coupon expires on {new Date(cart.appliedCoupon.expirationDate).toLocaleDateString()}
                            </p>
                          )}
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="mt-2"
                            onClick={handleClearCoupon}
                          >
                            <FaTimes className="me-1" /> Remove Coupon
                          </Button>
                        </div>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h2 className="h4 mb-0">Order Items</h2>
            </Card.Header>
            <Card.Body>
              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item 
                      key={index} 
                      className="mb-2 border rounded p-3"
                      style={styles.orderItem}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.orderItemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.orderItem)}
                    >
                      <Row className="align-items-center">
                        <Col xs={12} md={2}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                            className="border"
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <Link to={`/product/${item._id}`} className="fw-bold text-primary">
                            {item.name}
                          </Link>
                          {item.selectedSize && (
                            <div className="text-muted mt-1">Size: {item.selectedSize}</div>
                          )}
                          {item.selectedColor && (
                            <div className="d-flex align-items-center mt-1">
                              <span className="text-muted me-2">Color: {item.selectedColor.name}</span>
                              <span 
                                className="d-inline-block rounded-circle" 
                                style={{ 
                                  backgroundColor: item.selectedColor.hex,
                                  width: '16px',
                                  height: '16px',
                                  border: '1px solid #ddd'
                                }}
                              ></span>
                            </div>
                          )}
                          {item.customizations && (
                            <div className="mt-1">
                              <span className="badge bg-light text-dark border">
                                <FaInfoCircle className="me-1" />
                                Customized
                              </span>
                            </div>
                          )}
                        </Col>
                        <Col xs={12} md={4} className="text-md-end mt-2 mt-md-0">
                          <div className="fw-bold">
                            {item.qty} x ${item.price} = ${(item.qty * item.price).toFixed(2)}
                          </div>
                          {(item.customizations?.totalCost > 0 || item.customizations?.customizationPrice > 0 || item.tailoringCost > 0) && (
                            <div className="text-success">
                              + ${(
                                item.customizations?.totalCost || 
                                item.customizations?.customizationPrice || 
                                item.tailoringCost || 
                                0
                              ).toFixed(2)} (customization)
                            </div>
                          )}
                          <div className="fw-bold text-primary mt-1">
                            Item Total: ${(
                              (item.qty * item.price) + 
                              (item.customizations?.totalCost || 
                               item.customizations?.customizationPrice || 
                               item.tailoringCost || 
                               0)
                            ).toFixed(2)}
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Optional Coupon/Promo Code Section */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h4 className="h5 mb-0 d-flex align-items-center">
                <FaTag className="me-2 text-primary" /> 
                {cart.appliedCoupon ? 'Applied Discount' : 'Coupon or Promo Code'}
              </h4>
              {!cart.appliedCoupon && (
                <small className="text-muted badge bg-light text-dark">Optional</small>
              )}
            </Card.Header>
            
            {!cart.appliedCoupon && (
              <Card.Body>
                <div className="mb-3">
                  <small className="text-muted d-block">
                    Have a coupon or promo code? Enter it below to save on your order.
                  </small>
                </div>
                <Form onSubmit={handleApplyCoupon}>
                  <InputGroup className="mb-2">
                    <InputGroup.Text>
                      <FaTag className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Enter code (e.g., SAVE20, WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      isInvalid={!!couponError}
                      className="text-uppercase"
                    />
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? (
                        <>
                          <Spinner size="sm" className="me-1" /> Applying...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-1" />
                          Apply
                        </>
                      )}
                    </Button>
                  </InputGroup>
                  {couponError && (
                    <div className="alert alert-danger py-2 mb-2">
                      <small>
                        <FaTimes className="me-1" />
                        {couponError}
                      </small>
                    </div>
                  )}
                  <div className="mt-2">
                    <small className="text-muted">
                      <strong>Note:</strong> Codes are automatically converted to uppercase. Only one code can be applied per order.
                    </small>
                  </div>
                </Form>
              </Card.Body>
            )}
            
            {cart.appliedCoupon && (
              <Card.Body className="bg-success bg-opacity-10 border-success border-opacity-25">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-2 text-success d-flex align-items-center">
                      <FaCheckCircle className="me-2" />
                      <span className="fw-bold">{cart.appliedCoupon.code}</span> Applied!
                    </h6>
                    <div className="mb-2">
                      <small className="text-success">
                        {cart.appliedCoupon.description || 
                         `${cart.appliedCoupon.discountType === 'percentage' ? 
                           `${cart.appliedCoupon.discountValue}% discount` : 
                           `$${cart.appliedCoupon.discountValue} discount`}`}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <small className="text-success fw-bold me-3">
                        You Save: ${cart.discountAmount || '0.00'}
                      </small>
                      {cart.appliedCoupon.validUntil && (
                        <small className="text-muted">
                          Expires: {new Date(cart.appliedCoupon.validUntil).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClearCoupon}
                    className="ms-2"
                  >
                    <FaTimes />
                  </Button>
                </div>
              </Card.Body>
            )}

            <Card.Header className="bg-light">
              <h2 className="h4 mb-0">Payment Summary</h2>
            </Card.Header>
            <Card.Body>
              <ListGroup variant='flush'>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Items:</span>
                  <span>${displayItemsPrice.toFixed(2)}</span>
                </ListGroup.Item>

                {totalCustomizationCost > 0 && (
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Customizations:</span>
                    <span>+${totalCustomizationCost.toFixed(2)}</span>
                  </ListGroup.Item>
                )}

                {cart.appliedCoupon && (
                  <>
                    <ListGroup.Item className="d-flex justify-content-between text-success">
                      <span>Discount ({cart.appliedCoupon.code}):</span>
                      <span>-${actualDiscountAmount.toFixed(2)}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between">
                      <span>After Discount:</span>
                      <span>${discountedPrice.toFixed(2)}</span>
                    </ListGroup.Item>
                  </>
                )}

                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Shipping:</span>
                  <span>${displayShippingPrice.toFixed(2)}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Tax:</span>
                  <span>${displayTaxPrice.toFixed(2)}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>${displayTotalPrice.toFixed(2)}</span>
                </ListGroup.Item>
              </ListGroup>

              {orderError && (
                <Alert variant="danger" className="my-3">
                  <FaExclamationTriangle className="me-2" />
                  {orderError}
                </Alert>
              )}

              <div className="d-grid gap-2 mt-3">
                <Button
                  type='button'
                  className='btn-block'
                  disabled={cart.cartItems.length === 0 || isLoading}
                  onClick={placeOrderHandler}
                  style={styles.checkoutButton}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </div>

              {isLoading && <Loader />}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PlaceOrderScreen;

<style>
{`
  .discount-highlight {
    display: flex;
    align-items: center;
    background-color: #f0fff4;
    padding: 10px;
    border-radius: 8px;
    border-left: 4px solid #28a745;
    width: 100%;
  }
  
  .savings-breakdown {
    background-color: #f8f9fa;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.9rem;
    margin: 8px 0;
  }
  
  .coupon-expiry {
    margin-top: 5px;
    font-style: italic;
  }
`}
</style>
