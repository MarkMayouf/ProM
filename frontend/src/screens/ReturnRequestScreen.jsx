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
  InputGroup
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { useGetOrderDetailsQuery } from '../slices/ordersApiSlice';
import { useCreateReturnMutation } from '../slices/returnApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ReturnRequestScreen = () => {
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

  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);
  const [createReturn, { isLoading: isCreatingReturn }] = useCreateReturnMutation();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  const returnReasons = [
    { value: 'defective', label: 'Defective/Damaged Item' },
    { value: 'wrong_size', label: 'Wrong Size' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'damaged_shipping', label: 'Damaged During Shipping' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'duplicate_order', label: 'Duplicate Order' },
    { value: 'other', label: 'Other' }
  ];

  const handleItemSelection = (orderItem, returnQty, itemReturnReason, condition) => {
    const existingIndex = selectedItems.findIndex(item => item.orderItemId === orderItem._id);
    
    if (returnQty === 0) {
      // Remove item if quantity is 0
      if (existingIndex !== -1) {
        setSelectedItems(selectedItems.filter((_, index) => index !== existingIndex));
      }
    } else {
      const newItem = {
        orderItemId: orderItem._id,
        returnQty: parseInt(returnQty),
        returnReason: itemReturnReason,
        condition: condition || 'new'
      };

      if (existingIndex !== -1) {
        // Update existing item
        const updatedItems = [...selectedItems];
        updatedItems[existingIndex] = newItem;
        setSelectedItems(updatedItems);
      } else {
        // Add new item
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
    setUploadedImages(prevImages => [...prevImages, ...files]);
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
        returnShippingAddress: order.shippingAddress,
        returnMethod,
        customerNotes,
        uploadedImages
      };

      await createReturn(returnData).unwrap();
      toast.success('Return request submitted successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit return request');
    }
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
          
          <Card className="mb-4">
            <Card.Header>
              <h3 className="mb-0">
                <FaBoxOpen className="me-2" />
                Return Request - Order #{order._id.slice(-6)}
              </h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Order Date:</strong> {order.createdAt && !isNaN(new Date(order.createdAt).getTime()) 
                    ? format(new Date(order.createdAt), 'PPP') 
                    : 'N/A'}</p>
                  <p><strong>Order Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                  <p><strong>Payment Status:</strong> 
                    <Badge variant={order.isPaid ? 'success' : 'warning'} className="ms-2">
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Delivery Status:</strong> 
                    <Badge variant={order.isDelivered ? 'success' : 'warning'} className="ms-2">
                      {order.isDelivered ? 'Delivered' : 'Pending'}
                    </Badge>
                  </p>
                  {order.deliveredAt && order.deliveredAt && !isNaN(new Date(order.deliveredAt).getTime()) && (
                    <p><strong>Delivered:</strong> {format(new Date(order.deliveredAt), 'PPP')}</p>
                  )}
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
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Select Items to Return</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Ordered Qty</th>
                        <th>Return Qty</th>
                        <th>Reason</th>
                        <th>Condition</th>
                        <th>Refund</th>
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
                                  value={selectedItem?.returnReason || 'defective'}
                                  onChange={(e) => handleItemSelection(
                                    item,
                                    returnQty,
                                    e.target.value,
                                    selectedItem?.condition
                                  )}
                                >
                                  {returnReasons.map(reason => (
                                    <option key={reason.value} value={reason.value}>
                                      {reason.label}
                                    </option>
                                  ))}
                                </Form.Select>
                              )}
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
                                  <option value="new">New</option>
                                  <option value="like_new">Like New</option>
                                  <option value="good">Good</option>
                                  <option value="fair">Fair</option>
                                  <option value="poor">Poor</option>
                                </Form.Select>
                              )}
                            </td>
                            <td>
                              <strong>${refundAmount.toFixed(2)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  
                  {selectedItems.length > 0 && (
                    <div className="text-end mt-3">
                      <h5>Total Refund Amount: ${calculateTotalRefund().toFixed(2)}</h5>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {selectedItems.length > 0 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Return Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Primary Return Reason</Form.Label>
                          <Form.Select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            required
                          >
                            <option value="">Select a reason...</option>
                            {returnReasons.map(reason => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Return Method</Form.Label>
                          <Form.Select
                            value={returnMethod}
                            onChange={(e) => setReturnMethod(e.target.value)}
                          >
                            <option value="mail">Mail Return</option>
                            <option value="store_return">Store Return</option>
                            <option value="pickup">Pickup Service</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Detailed Explanation</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={detailedReason}
                        onChange={(e) => setDetailedReason(e.target.value)}
                        placeholder="Please provide more details about why you're returning these items..."
                        maxLength={1000}
                      />
                      <Form.Text className="text-muted">
                        {detailedReason.length}/1000 characters
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Additional Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any additional information or special requests..."
                        maxLength={500}
                      />
                      <Form.Text className="text-muted">
                        {customerNotes.length}/500 characters
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Upload Photos (Optional)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <Form.Text className="text-muted">
                        Upload photos of the items you're returning to help us process your request faster.
                      </Form.Text>
                      {uploadedImages.length > 0 && (
                        <div className="mt-3">
                          <h6>Uploaded Images:</h6>
                          <Row>
                            {uploadedImages.map((image, index) => (
                              <Col xs={6} md={3} key={index} className="mb-2">
                                <div className="position-relative">
                                  <Image
                                    src={URL.createObjectURL(image)}
                                    alt={`Return item ${index + 1}`}
                                    thumbnail
                                    style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                  />
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="position-absolute top-0 end-0"
                                    onClick={() => removeImage(index)}
                                    style={{ transform: 'translate(25%, -25%)' }}
                                  >
                                    ×
                                  </Button>
                                </div>
                                <small className="text-muted">{image.name}</small>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                    </Form.Group>

                    <Alert variant="info">
                      <FaInfoCircle className="me-2" />
                      <strong>Return Process:</strong>
                      <ol className="mb-0 mt-2">
                        <li>Submit your return request</li>
                        <li>We'll review and approve within 1-2 business days</li>
                        <li>Receive return shipping instructions via email</li>
                        <li>Ship items back to us</li>
                        <li>Refund processed within 3-5 business days after inspection</li>
                      </ol>
                    </Alert>

                    <div className="d-flex justify-content-between">
                      <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => setShowConfirmModal(true)}
                        disabled={selectedItems.length === 0 || !returnReason}
                      >
                        Submit Return Request
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
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
          <p>Are you sure you want to submit this return request?</p>
          <div className="bg-light p-3 rounded">
            <p><strong>Items to Return:</strong> {selectedItems.length}</p>
            <p><strong>Total Refund Amount:</strong> ${calculateTotalRefund().toFixed(2)}</p>
            <p><strong>Return Reason:</strong> {returnReasons.find(r => r.value === returnReason)?.label}</p>
          </div>
          <p className="mt-3 text-muted">
            Once submitted, you'll receive a confirmation email with your return number and next steps.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitReturn}
            disabled={isCreatingReturn}
          >
            {isCreatingReturn ? 'Submitting...' : 'Confirm Return Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReturnRequestScreen; 