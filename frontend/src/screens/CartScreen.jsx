import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Row,
  Col,
  ListGroup,
  Image,
  Form,
  Button,
  Card,
  InputGroup,
  Accordion,
  Container,
  Alert,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Modal,
} from 'react-bootstrap';
import {
  FaTrash,
  FaShoppingCart,
  FaArrowRight,
  FaShoppingBag,
  FaTag,
  FaRegSadTear,
  FaCircle,
  FaCheck,
  FaRuler,
  FaComments,
  FaEdit,
  FaInfoCircle,
  FaArrowLeft,
  FaHeart,
  FaTshirt,
  FaBox,
  FaLock,
  FaExclamationTriangle,
  FaCut,
  FaTimes,
  FaMoneyBillWave,
  FaCircle as FaCircleIcon,
  FaDollarSign,
  FaRegClock,
} from 'react-icons/fa';
import Message from '../components/Message';

import {
  addToCart,
  removeFromCart,
  updateCartItemColor,
  updateCartItemCustomizations,
} from '../slices/cartSlice';
import { toggleWishlistItem } from '../slices/wishlistSlice';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import '../assets/styles/product.css';
import CustomizationChatbot from '../components/CustomizationChatbot';
import SizeRecommenderChatbot from '../components/SizeRecommenderChatbot';
import './CartScreen.css';
import { getFullImageUrl } from '../utils/imageUtils';
import { useScrollToTop } from '../hooks/useScrollToTop';

// Available colors for suits (this would normally come from a database or API)
const availableColors = [
  { id: 'navy', name: 'Navy Blue', hex: '#1a2c42' },
  { id: 'black', name: 'Black', hex: '#1c1c1c' },
  { id: 'charcoal', name: 'Charcoal', hex: '#3b3b3b' },
  { id: 'brown', name: 'Brown', hex: '#4f3222' },
  { id: 'gray', name: 'Light Gray', hex: '#6e7073' },
  { id: 'blue', name: 'Royal Blue', hex: '#1f4e8c' },
  { id: 'burgundy', name: 'Burgundy', hex: '#800020' },
  { id: 'olive', name: 'Olive Green', hex: '#556b2f' },
];

const CustomizationDetails = ({ customizations, onDeactivate, isDeactivated }) => {
  if (!customizations) return null;

  const {
    pants = {},
    measurements = {},
    pantsAlterations = {},
    options = {},
    alterations = {},
    additionalNotes = '',
    customizationPrice = 0,
    totalCost = 0,
    timestamp = '',
  } = customizations;

  return (
    <div className={`customization-details-container ${isDeactivated ? 'deactivated' : ''}`}>
      {/* Deactivation Strip */}
      {isDeactivated && (
        <div className="deactivation-strip">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2 text-warning" />
              <span className="fw-bold">Customization Temporarily Disabled</span>
            </div>
            <Button 
              variant="outline-warning" 
              size="sm"
              onClick={() => onDeactivate && onDeactivate(false)}
            >
              Reactivate
            </Button>
          </div>
        </div>
      )}

      <Accordion className='mt-2 customization-details'>
        <Accordion.Item eventKey='0'>
          <Accordion.Header>
            <div className="d-flex align-items-center justify-content-between w-100 me-3">
              <div className="d-flex align-items-center">
                <FaTshirt className="me-2 text-primary" />
                <span>Customization Details</span>
                {totalCost > 0 && (
                  <Badge bg="success" pill className="ms-2">
                    +${totalCost.toFixed(2)}
                  </Badge>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                {timestamp && (
                  <small className="text-muted">
                    Created: {new Date(timestamp).toLocaleDateString()}
                  </small>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate && onDeactivate(true);
                  }}
                  title="Temporarily disable this customization"
                >
                  <FaTimes size={12} />
                </Button>
              </div>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            {/* Pants Alterations */}
            {(pantsAlterations.waistAdjustment || pantsAlterations.lengthInseam || pantsAlterations.fitType) && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="mb-3 border-0 shadow-sm">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">
                        <FaCut className="me-2" />
                        Pants Alterations
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {shouldDisplayValue(pantsAlterations.waistAdjustment) && (
                          <Col md={4}>
                            <div className="alteration-item">
                              <strong>Waist Adjustment:</strong>
                              <span className={`ms-2 ${pantsAlterations.waistAdjustment > 0 ? 'text-success' : 'text-danger'}`}>
                                {pantsAlterations.waistAdjustment > 0 ? '+' : ''}{pantsAlterations.waistAdjustment} cm
                              </span>
                            </div>
                          </Col>
                        )}
                        {shouldDisplayValue(pantsAlterations.lengthInseam) && (
                          <Col md={4}>
                            <div className="alteration-item">
                              <strong>Inseam Length:</strong>
                              <span className="ms-2 text-info">
                                {pantsAlterations.lengthInseam} inches
                              </span>
                            </div>
                          </Col>
                        )}
                        {shouldDisplayValue(pantsAlterations.fitType) && (
                          <Col md={4}>
                            <div className="alteration-item">
                              <strong>Fit Type:</strong>
                              <span className="ms-2 text-primary">
                                {pantsAlterations.fitType}
                              </span>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Style Customizations */}
            {Object.keys(options).length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="mb-3 border-0 shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <FaTshirt className="me-2" />
                        Style Customizations
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {options.lapelStyle && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Lapel:</strong>
                              <span className="ms-2">{options.lapelStyle}</span>
                            </div>
                          </Col>
                        )}
                        {options.buttonCount && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Buttons:</strong>
                              <span className="ms-2">{options.buttonCount}</span>
                            </div>
                          </Col>
                        )}
                        {options.ventStyle && options.ventStyle.trim() !== '' && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Vent:</strong>
                              <span className="ms-2">{options.ventStyle}</span>
                            </div>
                          </Col>
                        )}
                        {options.pocketStyle && options.pocketStyle.trim() !== '' && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Pocket:</strong>
                              <span className="ms-2">{options.pocketStyle}</span>
                            </div>
                          </Col>
                        )}
                        {options.liningColor && options.liningColor.trim() !== '' && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Lining:</strong>
                              <span className="ms-2">{options.liningColor}</span>
                            </div>
                          </Col>
                        )}
                        {options.monogram && options.monogram.trim() !== '' && (
                          <Col md={3} className="mb-2">
                            <div className="customization-item">
                              <strong>Monogram:</strong>
                              <span className="ms-2 text-warning">{options.monogram}</span>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Measurements */}
            <Row className="mb-4">
              <Col md={6}>
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaRuler className="me-2 text-primary" />
                      Pants Measurements
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <ul className='list-unstyled mb-0'>
                      {shouldDisplayValue(measurements.pantsLength) && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Length:</span>
                          <span className="fw-semibold">{measurements.pantsLength}"</span>
                        </li>
                      )}
                      {shouldDisplayValue(measurements.waist) && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Waist:</span>
                          <span className="fw-semibold">{measurements.waist}"</span>
                        </li>
                      )}
                      {shouldDisplayValue(measurements.inseam) && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Inseam:</span>
                          <span className="fw-semibold">{measurements.inseam}"</span>
                        </li>
                      )}
                      {measurements.outseam && measurements.outseam !== 0 && measurements.outseam !== '' && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Outseam:</span>
                          <span className="fw-semibold">{measurements.outseam}"</span>
                        </li>
                      )}
                      {pants.fit && pants.fit !== '' && pants.fit !== 'standard' && pants.fit !== 'Regular' && (
                        <li className="d-flex justify-content-between">
                          <span>Type:</span>
                          <span className="fw-semibold">{pants.fit}</span>
                        </li>
                      )}
                      {/* Show message if no pants measurements are available */}
                      {!measurements.pantsLength && !measurements.waist && !measurements.inseam && !measurements.outseam && (!pants.fit || pants.fit === '' || pants.fit === 'standard' || pants.fit === 'Regular') && (
                        <li className="text-muted text-center py-2">
                          <em>No specific measurements added</em>
                        </li>
                      )}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaRuler className="me-2 text-primary" />
                      Jacket Measurements
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <ul className='list-unstyled mb-0'>
                      {measurements.sleeve && measurements.sleeve !== 0 && measurements.sleeve !== '' && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Sleeves:</span>
                          <span className="fw-semibold">{measurements.sleeve}"</span>
                        </li>
                      )}
                      {measurements.backLength && measurements.backLength !== 0 && measurements.backLength !== '' && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Back Length:</span>
                          <span className="fw-semibold">{measurements.backLength}"</span>
                        </li>
                      )}
                      {measurements.chest && measurements.chest !== 0 && measurements.chest !== '' && (
                        <li className="d-flex justify-content-between mb-2">
                          <span>Chest:</span>
                          <span className="fw-semibold">{measurements.chest}"</span>
                        </li>
                      )}
                      {measurements.shoulder && measurements.shoulder !== 0 && measurements.shoulder !== '' && (
                        <li className="d-flex justify-content-between">
                          <span>Shoulders:</span>
                          <span className="fw-semibold">{measurements.shoulder}"</span>
                        </li>
                      )}
                      {/* Show message if no jacket measurements are available */}
                      {!measurements.sleeve && !measurements.backLength && !measurements.chest && !measurements.shoulder && (
                        <li className="text-muted text-center py-2">
                          <em>No specific measurements added</em>
                        </li>
                      )}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Cost Breakdown */}
            <Row className="mb-3">
              <Col md={12}>
                <Card className="border-success">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">
                      <FaMoneyBillWave className="me-2" />
                      Cost Breakdown
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="cost-breakdown">
                      {pantsAlterations.waistAdjustment && Math.abs(pantsAlterations.waistAdjustment) > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span>Waist Adjustment</span>
                          <span className="text-success">+$25.00</span>
                        </div>
                      )}
                      {pantsAlterations.lengthInseam && pantsAlterations.lengthInseam > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span>Length Adjustment</span>
                          <span className="text-success">+$20.00</span>
                        </div>
                      )}
                      {pantsAlterations.fitType && pantsAlterations.fitType !== 'Regular' && (
                        <div className="d-flex justify-content-between mb-1">
                          <span>{pantsAlterations.fitType} Fit</span>
                          <span className="text-success">+$15.00</span>
                        </div>
                      )}
                      {options.monogram && options.monogram.trim() !== '' && (
                        <div className="d-flex justify-content-between mb-1">
                          <span>Monogram</span>
                          <span className="text-success">+$25.00</span>
                        </div>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Total Customization Cost</span>
                        <span className="text-success">+${totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {additionalNotes && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FaInfoCircle className="me-2 text-primary" />
                    Additional Notes
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className='mb-0'>{additionalNotes}</p>
                </Card.Body>
              </Card>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

// Helper function to check if a value should be displayed (not zero, empty, or default)
const shouldDisplayValue = (value, defaultValues = ['', '0', 'standard', 'Regular', 'default']) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number' && value === 0) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '0') return false;
    if (defaultValues.includes(trimmed)) return false;
  }
  if (typeof value === 'number' && Math.abs(value) === 0) return false;
  return true;
};

const CartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const {
    cartItems,
    itemsPrice,
    discountedItemsPrice,
    discountAmount,
    shippingPrice,
    taxPrice,
    totalPrice,
    appliedCoupon,
  } = cart;

  const [expandedItem, setExpandedItem] = useState(null);
  const [showCustomizationChatbot, setShowCustomizationChatbot] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showChatGuide, setShowChatGuide] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [deactivatedCustomizations, setDeactivatedCustomizations] = useState({});

  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  const customizationTotal = cartItems.reduce((total, item) => {
    return total + (item.customizations?.totalCost || item.customizationPrice || 0);
  }, 0);

  const subtotalWithCustomizations = parseFloat(itemsPrice) + customizationTotal;

  // Calculate the correct total including all costs
  const calculatedTotal = parseFloat(itemsPrice) + customizationTotal + parseFloat(shippingPrice) + parseFloat(taxPrice) - parseFloat(discountAmount || 0);

  // Debug logging
  console.log('Cart Calculation Debug:', {
    itemsPrice: parseFloat(itemsPrice),
    customizationTotal,
    shippingPrice: parseFloat(shippingPrice),
    taxPrice: parseFloat(taxPrice),
    discountAmount: parseFloat(discountAmount || 0),
    calculatedTotal,
    originalTotalPrice: totalPrice
  });
  
  // Debug cart items with customizations
  console.log('Cart Items Debug:', cartItems.map(item => ({
    name: item.name,
    hasCustomizations: !!item.customizations,
    customizationsType: typeof item.customizations,
    customizationsData: item.customizations,
    tailoringCost: item.tailoringCost
  })));

  const addToCartHandler = async (product, qty) => {
    const button = document.querySelector(`button[data-product-id="${product._id}"]`);
    if (button) {
      button.classList.add('adding');
      setTimeout(() => button.classList.remove('adding'), 500);
    }

    dispatch(addToCart({ ...product, qty }));
  };

  const removeFromCartHandler = (id) => {
    const cartItemElement = document.querySelector(`[data-item-id="${id}"]`);
    
    if (cartItemElement) {
      cartItemElement.classList.add('removing');
      setTimeout(() => {
        dispatch(removeFromCart({ id }));
        setShowRemoveConfirm(false);
      }, 300);
    } else {
      dispatch(removeFromCart({ id }));
      setShowRemoveConfirm(false);
    }
  };

  const changeColorHandler = (item, colorId) => {
    const newColor = availableColors.find((c) => c.id === colorId);
    if (newColor) {
      dispatch(
        updateCartItemColor({
          id: item._id,
          size: item.selectedSize,
          customizations: item.customizations,
          color: newColor,
        })
      );
      toast.success(`Color changed to ${newColor.name}`);
      setShowColorPicker(null);
    }
  };

  const toggleItemExpand = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const checkoutHandler = () => {
    navigate('/login?redirect=/shipping');
  };

  const toggleColorPicker = (itemId) => {
    setShowColorPicker(showColorPicker === itemId ? null : itemId);
  };

  const openCustomizationChatbot = (item) => {
    // Skip customization for shoes and accessories
    if (item.category === 'Shoes' || item.category === 'Accessories') {
      toast.info('Customization is not available for shoes and accessories.');
      return;
    }
    
    setSelectedItem(item);
    setShowCustomizationChatbot(true);
    setIsCustomizing(true);
    
    // Remove automatic scroll that causes unwanted page jumping
    // setTimeout(() => {
    //   window.scrollTo({
    //     top: 0,
    //     behavior: 'smooth'
    //   });
    // }, 100);
  };

  const handleCustomizeItem = (item) => {
    setSelectedItem(item);
    setShowCustomizationChatbot(true);
  };

  const handleCustomizationComplete = (customizationData) => {
    if (selectedItem) {
      // Update the cart item with new customization data
      const updatedItem = {
        ...selectedItem,
        customizations: customizationData,
        tailoringCost: customizationData.totalCost || 0
      };
      
      // Update the cart
      dispatch(addToCart(updatedItem, selectedItem.qty));
      
      // Show success message
      toast.success('Customization updated successfully!');
      
      // Close the chatbot
      setShowCustomizationChatbot(false);
      setSelectedItem(null);
    }
  };

  const handleCustomizationCancel = () => {
    setShowCustomizationChatbot(false);
    setSelectedItem(null);
  };

  const handleCustomizationDeactivation = (itemId, isDeactivated) => {
    setDeactivatedCustomizations(prev => ({
      ...prev,
      [itemId]: isDeactivated
    }));
    
    if (isDeactivated) {
      toast.info('Customization temporarily disabled');
    } else {
      toast.success('Customization reactivated');
    }
  };

  return (
    <Container className="cart-container py-4">
      {/* Enhanced Page Header */}
      <div className="cart-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">
          <FaShoppingCart className="me-2 text-primary" />
          Shopping Cart
        </h1>
            <p className="text-muted mb-0">
              {cartItems.length > 0 
                ? `${cartItems.reduce((acc, item) => acc + item.qty, 0)} items in your cart`
                : 'Your cart is empty'
              }
            </p>
          </div>
          <div className="d-flex gap-2">
            {wishlistItems.length > 0 && (
              <LinkContainer to="/wishlist">
                <Button variant="outline-info" className="d-flex align-items-center">
                  <FaHeart className="me-2" />
                  Saved Items ({wishlistItems.length})
                </Button>
              </LinkContainer>
            )}
            <LinkContainer to="/">
              <Button variant="outline-primary" className="d-flex align-items-center">
                <FaArrowLeft className="me-2" />
                Continue Shopping
              </Button>
            </LinkContainer>
            {cartItems.length > 0 && (
              <Button 
                variant="outline-danger" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your cart?')) {
                    cartItems.forEach(item => dispatch(removeFromCart({ id: item._id })));
                    toast.success('Cart cleared');
                  }
                }}
                className="d-flex align-items-center"
              >
                <FaTrash className="me-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add CustomizationChatbot component */}
      {showCustomizationChatbot && selectedItem && (
        <Card className="mb-4 chatbot-card border-0 shadow-sm">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaRuler className="me-2" /> 
              Customize {selectedItem.name}
            </h5>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleCustomizationCancel}
            >
              Close
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            <CustomizationChatbot
              show={showCustomizationChatbot}
              onHide={handleCustomizationCancel}
              onCustomizationComplete={handleCustomizationComplete}
              initialCustomizations={selectedItem?.customizations}
              productType={selectedItem.category}
              productName={selectedItem.name}
            />
          </Card.Body>
        </Card>
      )}

      {/* Add Modal for remove confirmation */}
      <Modal show={showRemoveConfirm} onHide={() => setShowRemoveConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove {itemToRemove?.name} from your cart?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => removeFromCartHandler(itemToRemove._id)}>
            Remove Item
          </Button>
        </Modal.Footer>
      </Modal>

      {cartItems.length === 0 ? (
        <Card className="text-center p-5 empty-cart-container border-0 shadow-sm">
          <div className="empty-cart-icon mb-4">
            <FaRegSadTear size={60} className="text-muted" />
          </div>
          <h3>Your cart is empty</h3>
          <p className="text-muted mb-4">
            Looks like you haven't added any items to your cart yet.
          </p>
          <div className="d-flex justify-content-center">
            <LinkContainer to="/">
              <Button variant="primary" size="lg" className="px-4 shop-now-btn">
                <FaShoppingBag className="me-2" /> Start Shopping
              </Button>
            </LinkContainer>
          </div>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">Cart Items ({cartItems.reduce((acc, item) => acc + item.qty, 0)})</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {cartItems.map((item, idx) => (
                  <ListGroup.Item 
                    key={`${item._id}-${item.selectedSize}-${idx}`} 
                    className="py-4 cart-item"
                    data-item-id={item._id}
                  >
                    <Row className="align-items-center">
                      {/* Product Image */}
                      <Col md={3}>
                        <div className="cart-item-image">
                          <Link to={`/product/${item._id}`}>
                            <Image
                              src={getFullImageUrl(item.image)}
                              alt={item.name}
                              className="cart-product-image"
                              fluid
                              rounded
                            />
                          </Link>
                        </div>
                      </Col>
                      
                      {/* Product Details */}
                      <Col md={5}>
                        <div className="cart-item-details">
                          <Link 
                            to={`/product/${item._id}`} 
                            className="cart-item-name text-decoration-none"
                          >
                            <h5 className="mb-2">{item.name}</h5>
                          </Link>
                          
                          <div className="product-meta mb-2">
                            {item.selectedSize && (
                              <span className="me-3">
                                <strong>Size:</strong> {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="me-3">
                                <strong>Color:</strong> {item.selectedColor.name}
                              </span>
                            )}
                          </div>

                          <div className="cart-item-actions">
                            <div className="d-flex gap-2 flex-wrap">
                              {/* Edit button for eligible items */}
                              {['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts'].includes(item.category) && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    // Create URL with parameters to preserve existing customizations and size
                                    const params = new URLSearchParams();
                                    params.set('customize', 'true');
                                    if (item.selectedSize) {
                                      params.set('size', item.selectedSize);
                                    }
                                    if (item.customizations) {
                                      params.set('cartItemId', item._id);
                                    }
                                    navigate(`/product/${item._id}?${params.toString()}`);
                                  }}
                                  className="d-flex align-items-center"
                                >
                                  <FaEdit className="me-1" />
                                  Edit
                                </Button>
                              )}
                              
                              {/* Move to Wishlist Button */}
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                  // Add to wishlist
                                  dispatch(toggleWishlistItem({
                                    _id: item._id,
                                    name: item.name,
                                    image: item.image,
                                    price: item.price,
                                    brand: item.brand,
                                    category: item.category
                                  }));
                                  
                                  // Remove from cart
                                  dispatch(removeFromCart({ 
                                    id: item._id, 
                                    size: item.selectedSize 
                                  }));
                                  
                                  toast.success('Item saved for later in wishlist', { autoClose: 2000 });
                                }}
                                className="d-flex align-items-center"
                              >
                                <FaHeart className="me-1" />
                                Save for Later
                              </Button>
                              
                              {/* Remove Button */}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setItemToRemove(item);
                                  setShowRemoveConfirm(true);
                                }}
                                className="d-flex align-items-center"
                              >
                                <FaTrash className="me-1" />
                                Remove
                            </Button>
                            </div>
                          </div>
                        </div>
                      </Col>
                      
                      {/* Quantity and Price */}
                      <Col md={4}>
                        <div className="cart-item-pricing text-end">
                          {/* Show sale information if item is on sale */}
                          {item.isOnSale && item.originalPrice && item.originalPrice > item.price ? (
                            <div className="sale-pricing mb-2">
                              <div className="current-price h4 text-danger mb-1">
                                ${(item.price * item.qty).toFixed(2)}
                              </div>
                              <div className="original-price text-muted text-decoration-line-through mb-1">
                                ${(item.originalPrice * item.qty).toFixed(2)}
                              </div>
                              <Badge bg="success" className="discount-badge">
                                {item.discountPercentage || Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                              </Badge>
                            </div>
                          ) : (
                            <div className="current-price h4 text-primary mb-3">
                              ${(item.price * item.qty).toFixed(2)}
                            </div>
                          )}
                          
                          <div className="quantity-controls">
                            <div className="quantity-selector-simple d-flex align-items-center justify-content-end">
                              <span className="quantity-label me-2">Qty:</span>
                              <div className="quantity-buttons d-flex align-items-center">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="quantity-btn"
                                  onClick={() => addToCartHandler(item, Math.max(1, item.qty - 1))}
                                  disabled={item.qty <= 1}
                                >
                                  -
                                </Button>
                                <span className="quantity-display mx-2">{item.qty}</span>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="quantity-btn"
                                  onClick={() => addToCartHandler(item, Math.min(item.countInStock, item.qty + 1))}
                                  disabled={item.qty >= item.countInStock}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Customization Details Section - Compact & Collapsible */}
                    {((item.customizations && Object.keys(item.customizations).length > 0) || item.tailoringCost > 0) && (
                      <Row className="mt-2">
                        <Col md={12}>
                          <Accordion className="customization-accordion-compact">
                            <Accordion.Item eventKey="0" className="border-0">
                              <Accordion.Header className="py-2">
                                <div className="d-flex align-items-center justify-content-between w-100 me-3">
                                  <div className="d-flex align-items-center">
                                    <FaTshirt className="me-2 text-primary" size={14} />
                                    <span className="fw-semibold" style={{fontSize: '0.9rem'}}>Customizations</span>
                                    {(item.customizations.totalCost || item.tailoringCost || item.customizations.alterationCost) > 0 && (
                                      <Badge bg="success" pill className="ms-2" style={{fontSize: '0.75rem'}}>
                                        +${(item.customizations.totalCost || item.tailoringCost || item.customizations.alterationCost).toFixed(2)}
                                      </Badge>
                                    )}
                                  </div>
                                  <small className="text-muted">
                                    {item.customizations.timestamp && 
                                      new Date(item.customizations.timestamp).toLocaleDateString()
                                    }
                                  </small>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body className="py-2">
                                <div className="customization-items-compact">
                                  {/* Direct customization properties from SuitCustomizer */}
                                  {shouldDisplayValue(item.customizations.waistAdjustment) && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Waist Adjustment
                                      </span>
                                      <Badge bg="info" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.waistAdjustment > 0 ? '+' : ''}{Math.abs(item.customizations.waistAdjustment)}"
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {shouldDisplayValue(item.customizations.lengthAdjustment) && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Length Adjustment
                                      </span>
                                      <Badge bg="info" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.lengthAdjustment > 0 ? '+' : ''}{Math.abs(item.customizations.lengthAdjustment)}"
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.fitType && item.customizations.fitType !== '' && item.customizations.fitType !== 'standard' && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaTshirt className="me-1" size={12} />
                                        Fit Type
                                      </span>
                                      <Badge bg="success" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.fitType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Pants Alterations */}
                                  {shouldDisplayValue(item.customizations.pantsAlterations?.waistAdjustment) && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Waist Adjustment
                                      </span>
                                      <Badge bg="info" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.pantsAlterations.waistAdjustment > 0 ? '+' : ''}{Math.abs(item.customizations.pantsAlterations.waistAdjustment)}"
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {shouldDisplayValue(item.customizations.pantsAlterations?.lengthInseam) && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Inseam Length
                                      </span>
                                      <Badge bg="info" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.pantsAlterations.lengthInseam}"
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.pantsAlterations?.notes && item.customizations.pantsAlterations.notes.trim() !== '' && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaComments className="me-1" size={12} />
                                        Notes
                                      </span>
                                      <span className="text-truncate" 
                                            style={{maxWidth: '150px', fontSize: '0.8rem'}} 
                                            title={item.customizations.pantsAlterations.notes}>
                                        {item.customizations.pantsAlterations.notes}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Legacy customizations for backward compatibility */}
                                  {item.customizations.measurements?.waistSize && item.customizations.measurements.waistSize !== '' && item.customizations.measurements.waistSize !== 0 && item.customizations.measurements.waistSize !== '0' && Number(item.customizations.measurements.waistSize) !== 0 && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Waist
                                      </span>
                                      <Badge bg="secondary" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.measurements.waistSize}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.measurements?.inseamLength && item.customizations.measurements.inseamLength !== '' && item.customizations.measurements.inseamLength !== 0 && item.customizations.measurements.inseamLength !== '0' && Number(item.customizations.measurements.inseamLength) !== 0 && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Inseam
                                      </span>
                                      <Badge bg="secondary" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.measurements.inseamLength}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.preferences?.fit && item.customizations.preferences.fit !== '' && item.customizations.preferences.fit !== 'standard' && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaTshirt className="me-1" size={12} />
                                        Fit
                                      </span>
                                      <Badge bg="success" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.preferences.fit}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.options?.monogram && item.customizations.options.monogram.trim() !== '' && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaTshirt className="me-1" size={12} />
                                        Monogram
                                      </span>
                                      <Badge bg="primary" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.options.monogram}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {item.customizations.recommendedSize && item.customizations.recommendedSize !== '' && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaRuler className="me-1" size={12} />
                                        Recommended Size
                                      </span>
                                      <Badge bg="info" style={{fontSize: '0.75rem'}}>
                                        {item.customizations.recommendedSize}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {Object.values(item.customizations.alterations || {}).some(v => v && v !== 0 && v !== '0' && Number(v) !== 0 && v !== '' && v !== null && v !== undefined) && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaCut className="me-1" size={12} />
                                        Custom Alterations
                                      </span>
                                      <Badge bg="warning" style={{fontSize: '0.75rem'}}>
                                        Applied
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Show tailoring cost if only that exists */}
                                  {item.tailoringCost > 0 && !item.customizations && (
                                    <div className="customization-item-compact d-flex justify-content-between align-items-center mb-1">
                                      <span className="text-muted" style={{fontSize: '0.85rem'}}>
                                        <FaDollarSign className="me-1" size={12} />
                                        Tailoring Cost
                                      </span>
                                      <Badge bg="success" style={{fontSize: '0.75rem'}}>
                                        +${item.tailoringCost.toFixed(2)}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          </Accordion>
                        </Col>
                      </Row>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
          
          {/* Order Summary */}
          <Col lg={4}>
            <Card className="order-summary border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between mb-3">
                  <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items):</span>
                  <span className="fw-semibold">${itemsPrice}</span>
                </div>
                
                {customizationTotal > 0 && (
                  <div className="d-flex justify-content-between mb-3">
                    <span>Customization:</span>
                    <span className="fw-semibold text-success">+${customizationTotal.toFixed(2)}</span>
                  </div>
                )}
                
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-3 text-success">
                    <span>Discount:</span>
                    <span className="fw-semibold">-${discountAmount}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mb-3">
                  <span>Shipping:</span>
                  <span className="fw-semibold">${shippingPrice}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-4">
                  <span>Tax:</span>
                  <span className="fw-semibold">${taxPrice}</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="d-flex justify-content-between mb-4">
                  <span className="h4 mb-0">Total:</span>
                  <span className="h4 mb-0 text-primary">
                    ${calculatedTotal.toFixed(2)}
                  </span>
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 checkout-btn mb-3"
                  disabled={cartItems.length === 0}
                  onClick={checkoutHandler}
                >
                  <FaArrowRight className="me-2" />
                  Proceed To Checkout
                </Button>
                
                {/* Shipping & Security Notice */}
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3 bg-light p-3 rounded">
                    <FaBox className="text-success me-3" size={20} />
                    <div>
                      <h6 className="mb-0">Free Shipping</h6>
                      <small className="text-muted">On orders over $50</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center bg-light p-3 rounded">
                    <FaLock className="text-success me-3" size={20} />
                    <div>
                      <h6 className="mb-0">Secure Checkout</h6>
                      <small className="text-muted">SSL encrypted payment</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style jsx="true">{`
        .cart-container {
          margin-bottom: 2rem;
        }
        
        .cart-header {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 15px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        
        .cart-item {
          transition: all 0.3s ease;
          border-radius: 10px;
          margin-bottom: 1rem;
          background: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .cart-item:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        
        .cart-item.removing {
          opacity: 0;
          transform: translateX(100px);
        }
        
        .cart-product-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          transition: transform 0.3s ease;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .cart-product-image:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .cart-item-name {
          color: #1a2c42;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        
        .cart-item-name:hover {
          color: var(--bs-primary);
        }
        
        .cart-item-actions .btn {
          border-radius: 20px;
          font-size: 0.85rem;
          padding: 0.4rem 0.8rem;
          transition: all 0.3s ease;
        }
        
        .cart-item-actions .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .quantity-selector-simple {
          gap: 0.5rem;
        }
        
        .quantity-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 1px solid #ddd;
          background: white;
          transition: all 0.2s ease;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #007bff;
          color: #007bff;
        }
        
        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .quantity-display {
          min-width: 30px;
          text-align: center;
          font-weight: 600;
          font-size: 1rem;
        }
        
        .quantity-label {
          font-weight: 500;
          color: #6c757d;
        }
        
        .order-summary {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          border-radius: 15px;
          overflow: hidden;
        }
        
        .order-summary .card-header {
          background: linear-gradient(135deg, #007bff, #0056b3);
          border: none;
        }
        
        .empty-cart-container {
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          border-radius: 15px;
          padding: 3rem;
          text-align: center;
        }
        
        .empty-cart-icon {
          animation: bounce 2s infinite;
          color: #6c757d;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-20px);}
          60% {transform: translateY(-10px);}
        }
        
        .shop-now-btn {
          background: linear-gradient(to right, #1a2c42, #2c4a6b);
          border: none;
          transition: all 0.3s ease;
          border-radius: 25px;
          padding: 0.8rem 2rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .shop-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .checkout-btn {
          background: linear-gradient(to right, #1a2c42, #2c4a6b);
          border: none;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          border-radius: 10px;
          padding: 1rem;
        }
        
        .checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .customization-details {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 2px solid #e3f2fd !important;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .customization-details::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #007bff, #0056b3);
        }
        
        .customization-details:hover {
          border-color: #007bff !important;
          box-shadow: 0 6px 20px rgba(0, 123, 255, 0.15);
          transform: translateY(-2px);
        }
        
        .customization-header {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 0.75rem;
        }
        
        .customization-price-badge {
          background: linear-gradient(135deg, #e8f5e8, #d4edda);
          padding: 0.5rem 1rem;
          border-radius: 25px;
          border: 1px solid #c3e6cb;
        }
        
        .customization-edit-btn {
          border-radius: 20px;
          padding: 0.4rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .customization-edit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
        }
        
        .customization-summary-header h6 {
          color: #0056b3;
          font-weight: 600;
          margin-bottom: 0;
        }
        
        .customization-items-grid {
          display: grid;
          gap: 0.75rem;
        }
        
        .customization-item-row {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          border: 1px solid rgba(0, 123, 255, 0.1);
          transition: all 0.2s ease;
        }
        
        .customization-item-row:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(0, 123, 255, 0.2);
          transform: translateX(4px);
        }
        
        .customization-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }
        
        .customization-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        
        .customization-label {
          font-weight: 600;
          color: #495057;
          font-size: 0.875rem;
        }
        
        .customization-value {
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .customization-value.badge {
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
        }
        
        .customization-footer {
          background: rgba(0, 123, 255, 0.05);
          margin: 0 -1rem -1rem -1rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(0, 123, 255, 0.1);
        }

        /* Price Container Styles */
        .price-container {
          background: linear-gradient(135deg, #f8f9fa, #ffffff);
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .item-base-price .current-price {
          color: #495057;
          font-weight: 600;
          margin-bottom: 0;
        }

        .item-total-price {
          border-top: 2px solid #007bff;
          padding-top: 0.75rem;
          margin-top: 0.75rem;
        }

        .item-total-price .total-price {
          font-weight: 700;
          margin-bottom: 0;
        }

        /* Deactivation Strip Styles */
        .customization-details-container.deactivated {
          opacity: 0.6;
          pointer-events: none;
        }

        .deactivation-strip {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
        }

        .deactivation-strip .fw-bold {
          color: #856404;
        }

        .alteration-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .alteration-item:last-child {
          border-bottom: none;
        }

        .customization-item {
          padding: 0.25rem 0;
        }

        .cost-breakdown {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
        }

        .cost-breakdown hr {
          border-color: #28a745;
          opacity: 0.5;
        }

        /* Enhanced Customization Summary Card Styles */
        .customization-summary-card {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }

        .customization-summary-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }

        .customization-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }

        .customization-item:last-child {
          border-bottom: none;
        }

        .customization-item:hover {
          background: rgba(255,255,255,0.5);
          border-radius: 6px;
          margin: 0 -0.5rem;
          padding: 0.5rem;
        }

        .customization-item .badge {
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .customization-item .fw-medium {
          color: #495057;
          font-weight: 600;
        }
      `}</style>
    </Container>
  );
};

export default CartScreen;
