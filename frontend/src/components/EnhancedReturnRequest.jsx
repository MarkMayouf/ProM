import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Table,
  Badge,
  Modal,
  Image,
  ListGroup,
  InputGroup,
  ProgressBar,
  Accordion
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaUpload,
  FaTimes,
  FaCamera,
  FaFileImage,
  FaShippingFast,
  FaCalendarAlt,
  FaDollarSign,
  FaQuestionCircle
} from 'react-icons/fa';
import { useGetOrderDetailsQuery } from '../slices/ordersApiSlice';
import { useCreateReturnMutation } from '../slices/returnApiSlice';
import Loader from './Loader';
import Message from './Message';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const EnhancedReturnRequest = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [selectedItems, setSelectedItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [detailedReason, setDetailedReason] = useState('');
  const [returnMethod, setReturnMethod] = useState('mail');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [returnShippingAddress, setReturnShippingAddress] = useState(null);

  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);
  const [createReturn, { isLoading: isCreatingReturn }] = useCreateReturnMutation();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (order?.shippingAddress) {
      setReturnShippingAddress(order.shippingAddress);
    }
  }, [order]);

  const returnReasons = [
    { value: 'defective', label: 'Defective/Damaged Item', description: 'Item arrived damaged or has manufacturing defects' },
    { value: 'wrong_size', label: 'Wrong Size', description: 'Item doesn\'t fit as expected' },
    { value: 'wrong_item', label: 'Wrong Item Received', description: 'Received different item than ordered' },
    { value: 'not_as_described', label: 'Not as Described', description: 'Item doesn\'t match product description' },
    { value: 'damaged_shipping', label: 'Damaged During Shipping', description: 'Item was damaged during delivery' },
    { value: 'quality_issue', label: 'Quality Issue', description: 'Item quality is below expectations' },
    { value: 'changed_mind', label: 'Changed Mind', description: 'No longer need the item' },
    { value: 'duplicate_order', label: 'Duplicate Order', description: 'Accidentally ordered multiple times' },
    { value: 'other', label: 'Other', description: 'Please specify in additional details' }
  ];

  const returnMethods = [
    { value: 'mail', label: 'Mail Return', description: 'Ship item back using provided return label', icon: FaShippingFast },
    { value: 'store_return', label: 'Store Return', description: 'Return to nearest store location', icon: FaBoxOpen },
    { value: 'pickup', label: 'Pickup Service', description: 'Schedule pickup from your address', icon: FaCalendarAlt }
  ];

  const handleItemSelection = (orderItem, returnQty, itemReturnReason, condition) => {
    const existingIndex = selectedItems.findIndex(item => item.orderItemId === orderItem._id);
    
    if (returnQty === 0) {
      if (existingIndex !== -1) {
        setSelectedItems(selectedItems.filter((_, index) => index !== existingIndex));
      }
    } else {
      const newItem = {
        orderItemId: orderItem._id,
        name: orderItem.name,
        image: orderItem.image,
        price: orderItem.price,
        returnQty: parseInt(returnQty),
        returnReason: itemReturnReason,
        condition: condition || 'new'
      };

      if (existingIndex !== -1) {
        const updatedItems = [...selectedItems];
        updatedItems[existingIndex] = newItem;
        setSelectedItems(updatedItems);
      } else {
        setSelectedItems([...selectedItems, newItem]);
      }
    }
  };

  const calculateTotalRefund = () => {
    if (!order || !selectedItems.length) return 0;
    
    return selectedItems.reduce((total, selectedItem) => {
      const orderItem = order.orderItems.find(item => item._id === selectedItem.orderItemId);
      return total + (orderItem ? orderItem.price * selectedItem.returnQty : 0);
    }, 0);
  };

  const isOrderEligibleForReturn = () => {
    if (!order) return false;
    
    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const daysDifference = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
    
    return order.isPaid && order.isDelivered && daysDifference <= 30;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + uploadedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages(prev => [...prev, {
          file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    try {
      const returnData = {
        orderId,
        returnItems: selectedItems,
        returnReason,
        detailedReason,
        returnShippingAddress,
        returnMethod,
        customerNotes,
        images: uploadedImages.map(img => img.file)
      };

      await createReturn(returnData).unwrap();
      toast.success('Return request submitted successfully!');
      navigate('/profile?tab=returns');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit return request');
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }
    if (currentStep === 2 && !returnReason) {
      toast.error('Please select a return reason');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">Error: {error?.data?.message || error.error}</Message>;

  if (!order) {
    return <Message variant="danger">Order not found</Message>;
  }

  if (order.user !== userInfo._id) {
    return <Message variant="danger">Not authorized to view this order</Message>;
  }

  const isEligible = isOrderEligibleForReturn();

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
            <FaArrowLeft className="me-2" />
            Back
          </Button>
          
          {/* Progress Bar */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Return Request Process</h4>
                <Badge bg="primary">Step {currentStep} of 4</Badge>
              </div>
              <ProgressBar now={(currentStep / 4) * 100} className="mb-2" />
              <div className="d-flex justify-content-between small text-muted">
                <span className={currentStep >= 1 ? 'text-primary fw-bold' : ''}>Select Items</span>
                <span className={currentStep >= 2 ? 'text-primary fw-bold' : ''}>Return Reason</span>
                <span className={currentStep >= 3 ? 'text-primary fw-bold' : ''}>Return Method</span>
                <span className={currentStep >= 4 ? 'text-primary fw-bold' : ''}>Review & Submit</span>
              </div>
            </Card.Body>
          </Card>

          {/* Order Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaBoxOpen className="me-2" />
                Order #{order._id.slice(-6)}
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Order Date:</strong> {order.createdAt && !isNaN(new Date(order.createdAt).getTime()) 
                    ? format(new Date(order.createdAt), 'PPP') 
                    : 'N/A'}</p>
                  <p><strong>Order Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                  <p><strong>Payment Status:</strong> 
                    <Badge bg={order.isPaid ? 'success' : 'warning'} className="ms-2">
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Delivery Status:</strong> 
                    <Badge bg={order.isDelivered ? 'success' : 'warning'} className="ms-2">
                      {order.isDelivered ? 'Delivered' : 'Pending'}
                    </Badge>
                  </p>
                  {order.deliveredAt && order.deliveredAt && !isNaN(new Date(order.deliveredAt).getTime()) && (
                    <p><strong>Delivered:</strong> {format(new Date(order.deliveredAt), 'PPP')}</p>
                  )}
                  <p><strong>Return Eligible:</strong> 
                    <Badge bg={isEligible ? 'success' : 'danger'} className="ms-2">
                      {isEligible ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {!isEligible ? (
            <Alert variant="warning">
              <FaExclamationTriangle className="me-2" />
              <strong>Return Not Available</strong>
              <p className="mb-0 mt-2">
                This order is not eligible for return. Returns must be initiated within 30 days of delivery for paid and delivered orders.
              </p>
            </Alert>
          ) : (
            <>
              {/* Step 1: Select Items */}
              {currentStep === 1 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Step 1: Select Items to Return</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Ordered Qty</th>
                          <th>Return Qty</th>
                          <th>Condition</th>
                          <th>Refund Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.orderItems.map((item) => {
                          const selectedItem = selectedItems.find(si => si.orderItemId === item._id);
                          const returnQty = selectedItem?.returnQty || 0;
                          const refundAmount = item.price * returnQty;

                          return (
                            <tr key={item._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Image src={item.image} alt={item.name} width="50" height="50" rounded className="me-3" />
                                  <div>
                                    <div className="fw-bold">{item.name}</div>
                                    {item.selectedSize && <small className="text-muted">Size: {item.selectedSize}</small>}
                                  </div>
                                </div>
                              </td>
                              <td>${item.price.toFixed(2)}</td>
                              <td>{item.qty}</td>
                              <td>
                                <Form.Select
                                  size="sm"
                                  value={returnQty}
                                  onChange={(e) => handleItemSelection(
                                    item, 
                                    e.target.value, 
                                    selectedItem?.returnReason || 'defective',
                                    selectedItem?.condition || 'new'
                                  )}
                                  style={{ width: '80px' }}
                                >
                                  {[...Array(item.qty + 1)].map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                  ))}
                                </Form.Select>
                              </td>
                              <td>
                                {returnQty > 0 && (
                                  <Form.Select
                                    size="sm"
                                    value={selectedItem?.condition || 'new'}
                                    onChange={(e) => handleItemSelection(
                                      item,
                                      returnQty,
                                      selectedItem?.returnReason,
                                      e.target.value
                                    )}
                                  >
                                    <option value="new">New/Unused</option>
                                    <option value="like_new">Like New</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                  </Form.Select>
                                )}
                              </td>
                              <td>
                                <strong className="text-success">${refundAmount.toFixed(2)}</strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    
                    {selectedItems.length > 0 && (
                      <div className="text-end mt-3 p-3 bg-light rounded">
                        <h5 className="text-success">Total Refund Amount: ${calculateTotalRefund().toFixed(2)}</h5>
                        <small className="text-muted">Final refund amount may vary based on item condition and return policy</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Step 2: Return Reason */}
              {currentStep === 2 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Step 2: Return Reason</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {returnReasons.map(reason => (
                        <Col md={6} key={reason.value} className="mb-3">
                          <Card 
                            className={`h-100 cursor-pointer ${returnReason === reason.value ? 'border-primary bg-light' : ''}`}
                            onClick={() => setReturnReason(reason.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Card.Body>
                              <div className="d-flex align-items-start">
                                <Form.Check
                                  type="radio"
                                  name="returnReason"
                                  value={reason.value}
                                  checked={returnReason === reason.value}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  className="me-3"
                                />
                                <div>
                                  <h6 className="mb-1">{reason.label}</h6>
                                  <small className="text-muted">{reason.description}</small>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    <Form.Group className="mt-4">
                      <Form.Label>Additional Details</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={detailedReason}
                        onChange={(e) => setDetailedReason(e.target.value)}
                        placeholder="Please provide additional details about your return request..."
                        maxLength={1000}
                      />
                      <Form.Text className="text-muted">
                        {detailedReason.length}/1000 characters
                      </Form.Text>
                    </Form.Group>

                    {/* Image Upload */}
                    <div className="mt-4">
                      <h6>Upload Images (Optional)</h6>
                      <p className="text-muted small">Upload photos to help us process your return faster (max 5 images, 5MB each)</p>
                      
                      <InputGroup className="mb-3">
                        <Form.Control
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadedImages.length >= 5}
                        />
                        <InputGroup.Text>
                          <FaCamera />
                        </InputGroup.Text>
                      </InputGroup>

                      {uploadedImages.length > 0 && (
                        <Row>
                          {uploadedImages.map((image, index) => (
                            <Col xs={6} md={3} key={index} className="mb-2">
                              <div className="position-relative">
                                <Image
                                  src={image.preview}
                                  alt={`Upload ${index + 1}`}
                                  className="w-100"
                                  style={{ height: '100px', objectFit: 'cover' }}
                                  rounded
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="position-absolute top-0 end-0 m-1"
                                  onClick={() => removeImage(index)}
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                              <small className="text-muted d-block mt-1">{image.name}</small>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Step 3: Return Method */}
              {currentStep === 3 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Step 3: Return Method</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {returnMethods.map(method => {
                        const IconComponent = method.icon;
                        return (
                          <Col md={4} key={method.value} className="mb-3">
                            <Card 
                              className={`h-100 cursor-pointer ${returnMethod === method.value ? 'border-primary bg-light' : ''}`}
                              onClick={() => setReturnMethod(method.value)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Card.Body className="text-center">
                                <IconComponent size={32} className="text-primary mb-3" />
                                <h6>{method.label}</h6>
                                <p className="text-muted small">{method.description}</p>
                                <Form.Check
                                  type="radio"
                                  name="returnMethod"
                                  value={method.value}
                                  checked={returnMethod === method.value}
                                  onChange={(e) => setReturnMethod(e.target.value)}
                                />
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>

                    <Form.Group className="mt-4">
                      <Form.Label>Additional Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any additional notes or special instructions..."
                        maxLength={500}
                      />
                      <Form.Text className="text-muted">
                        {customerNotes.length}/500 characters
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Step 4: Review & Submit</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <h6 className="text-primary">Return Items</h6>
                        <ListGroup variant="flush">
                          {selectedItems.map((item, index) => (
                            <ListGroup.Item key={index} className="px-0">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <strong>{item.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    Qty: {item.returnQty} | Condition: {item.condition}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <strong>${(item.price * item.returnQty).toFixed(2)}</strong>
                                </div>
                              </div>
                            </ListGroup.Item>
                          ))}
                          <ListGroup.Item className="px-0 bg-light">
                            <div className="d-flex justify-content-between">
                              <strong>Total Refund:</strong>
                              <strong className="text-success">${calculateTotalRefund().toFixed(2)}</strong>
                            </div>
                          </ListGroup.Item>
                        </ListGroup>
                      </Col>
                      <Col md={6}>
                        <h6 className="text-primary">Return Details</h6>
                        <p><strong>Reason:</strong> {returnReasons.find(r => r.value === returnReason)?.label}</p>
                        <p><strong>Method:</strong> {returnMethods.find(m => m.value === returnMethod)?.label}</p>
                        {detailedReason && (
                          <p><strong>Details:</strong> {detailedReason}</p>
                        )}
                        {customerNotes && (
                          <p><strong>Notes:</strong> {customerNotes}</p>
                        )}
                        {uploadedImages.length > 0 && (
                          <p><strong>Images:</strong> {uploadedImages.length} uploaded</p>
                        )}
                      </Col>
                    </Row>

                    <Alert variant="info" className="mt-4">
                      <FaInfoCircle className="me-2" />
                      <strong>What happens next?</strong>
                      <ul className="mb-0 mt-2">
                        <li>We'll review your return request within 24-48 hours</li>
                        <li>You'll receive an email with return instructions and shipping label</li>
                        <li>Once we receive your item, we'll process the refund within 5-7 business days</li>
                        <li>Refund will be issued to your original payment method</li>
                      </ul>
                    </Alert>
                  </Card.Body>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between">
                <Button 
                  variant="outline-secondary" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 4 ? (
                  <Button variant="primary" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isCreatingReturn}
                  >
                    {isCreatingReturn ? 'Submitting...' : 'Submit Return Request'}
                  </Button>
                )}
              </div>
            </>
          )}
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Return Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to submit this return request?
          </Alert>
          <p>You are requesting to return {selectedItems.length} item(s) for a total refund of <strong>${calculateTotalRefund().toFixed(2)}</strong>.</p>
          <p className="text-muted small">
            Once submitted, you cannot modify this request. You will receive an email with further instructions.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitReturn} disabled={isCreatingReturn}>
            {isCreatingReturn ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnhancedReturnRequest; 