import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Alert,
  InputGroup,
  Badge,
  Modal,
} from 'react-bootstrap';
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaSave,
  FaArrowLeft,
  FaUser,
  FaShoppingCart,
  FaMapMarkerAlt,
  FaCreditCard,
} from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useCreateOrderMutation } from '../../slices/ordersApiSlice';
import { useGetProductsQuery } from '../../slices/productsApiSlice';
import { useGetUsersQuery } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';

const OrderCreateScreen = () => {
  const navigate = useNavigate();
  
  const [orderData, setOrderData] = useState({
    user: '',
    orderItems: [],
    shippingAddress: {
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
    paymentMethod: 'PayPal',
    itemsPrice: 0,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: 0,
    isPaid: false,
    isDelivered: false,
    adminNotes: '',
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const { data: products, isLoading: productsLoading } = useGetProductsQuery({});
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  // Calculate prices whenever order items change
  useEffect(() => {
    const itemsPrice = orderData.orderItems.reduce(
      (acc, item) => acc + item.price * item.qty,
      0
    );
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    setOrderData(prev => ({
      ...prev,
      itemsPrice: Number(itemsPrice.toFixed(2)),
      shippingPrice,
      taxPrice,
      totalPrice: Number(totalPrice.toFixed(2)),
    }));
  }, [orderData.orderItems]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrderData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const addProductToOrder = (product) => {
    const existingItem = orderData.orderItems.find(
      item => item.product === product._id
    );

    if (existingItem) {
      setOrderData(prev => ({
        ...prev,
        orderItems: prev.orderItems.map(item =>
          item.product === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        ),
      }));
    } else {
      const newItem = {
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        qty: 1,
        countInStock: product.countInStock,
      };
      setOrderData(prev => ({
        ...prev,
        orderItems: [...prev.orderItems, newItem],
      }));
    }
    setShowProductModal(false);
  };

  const removeProductFromOrder = (productId) => {
    setOrderData(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter(item => item.product !== productId),
    }));
  };

  const updateProductQuantity = (productId, qty) => {
    if (qty <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    setOrderData(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item =>
        item.product === productId ? { ...item, qty: Number(qty) } : item
      ),
    }));
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setOrderData(prev => ({
      ...prev,
      user: user._id,
    }));
    setShowUserModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderData.user) {
      toast.error('Please select a user for this order');
      return;
    }

    if (orderData.orderItems.length === 0) {
      toast.error('Please add at least one product to the order');
      return;
    }

    if (!orderData.shippingAddress.address || !orderData.shippingAddress.city) {
      toast.error('Please fill in the shipping address');
      return;
    }

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Order created successfully');
      navigate(`/admin/orderlist`);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to create order');
    }
  };

  const filteredProducts = products?.products?.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  return (
    <>
      <Container fluid>
        <Row>
          <Col md={3} lg={2}>
            <AdminSidebar activeKey="orders" />
          </Col>
          <Col md={9} lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Create New Order</h2>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/admin/orderlist')}
              >
                <FaArrowLeft className="me-2" />
                Back to Orders
              </Button>
            </div>

            <Form onSubmit={handleSubmit}>
              <Row>
                {/* Customer Information */}
                <Col lg={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <FaUser className="me-2" />
                      Customer Information
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Select Customer</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            placeholder="Click to select customer"
                            value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : ''}
                            readOnly
                            onClick={() => setShowUserModal(true)}
                            style={{ cursor: 'pointer' }}
                          />
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowUserModal(true)}
                          >
                            <FaSearch />
                          </Button>
                        </div>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Shipping Address */}
                  <Card className="mb-4">
                    <Card.Header>
                      <FaMapMarkerAlt className="me-2" />
                      Shipping Address
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter address"
                          value={orderData.shippingAddress.address}
                          onChange={(e) => handleInputChange('shippingAddress.address', e.target.value)}
                          required
                        />
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter city"
                              value={orderData.shippingAddress.city}
                              onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter postal code"
                              value={orderData.shippingAddress.postalCode}
                              onChange={(e) => handleInputChange('shippingAddress.postalCode', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter country"
                          value={orderData.shippingAddress.country}
                          onChange={(e) => handleInputChange('shippingAddress.country', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Payment & Status */}
                  <Card className="mb-4">
                    <Card.Header>
                      <FaCreditCard className="me-2" />
                      Payment & Status
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          value={orderData.paymentMethod}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        >
                          <option value="PayPal">PayPal</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash on Delivery">Cash on Delivery</option>
                        </Form.Select>
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label="Mark as Paid"
                            checked={orderData.isPaid}
                            onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label="Mark as Delivered"
                            checked={orderData.isDelivered}
                            onChange={(e) => handleInputChange('isDelivered', e.target.checked)}
                          />
                        </Col>
                      </Row>
                      <Form.Group className="mt-3">
                        <Form.Label>Admin Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Add any admin notes..."
                          value={orderData.adminNotes}
                          onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Order Items */}
                <Col lg={6}>
                  <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <span>
                        <FaShoppingCart className="me-2" />
                        Order Items
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowProductModal(true)}
                      >
                        <FaPlus className="me-1" />
                        Add Product
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      {orderData.orderItems.length === 0 ? (
                        <Alert variant="info">
                          No products added yet. Click "Add Product" to start building the order.
                        </Alert>
                      ) : (
                        <Table responsive size="sm">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Price</th>
                              <th>Qty</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderData.orderItems.map((item) => (
                              <tr key={item.product}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                      className="me-2 rounded"
                                    />
                                    <small>{item.name}</small>
                                  </div>
                                </td>
                                <td>${item.price}</td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    min="1"
                                    max={item.countInStock}
                                    value={item.qty}
                                    onChange={(e) => updateProductQuantity(item.product, e.target.value)}
                                    style={{ width: '70px' }}
                                    size="sm"
                                  />
                                </td>
                                <td>${(item.price * item.qty).toFixed(2)}</td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeProductFromOrder(item.product)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}

                      {/* Order Summary */}
                      {orderData.orderItems.length > 0 && (
                        <div className="mt-4 p-3 bg-light rounded">
                          <h6>Order Summary</h6>
                          <div className="d-flex justify-content-between">
                            <span>Items:</span>
                            <span>${orderData.itemsPrice}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Shipping:</span>
                            <span>${orderData.shippingPrice}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Tax:</span>
                            <span>${orderData.taxPrice}</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Total:</span>
                            <span>${orderData.totalPrice}</span>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Submit Button */}
                  <div className="d-grid">
                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      disabled={creating || orderData.orderItems.length === 0 || !orderData.user}
                    >
                      {creating ? (
                        <>
                          <Loader size="sm" className="me-2" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Create Order
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>

      {/* Product Selection Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </InputGroup>
          </Form.Group>

          {productsLoading ? (
            <Loader />
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredProducts.map((product) => (
                <Card key={product._id} className="mb-2">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          className="me-3 rounded"
                        />
                        <div>
                          <h6 className="mb-1">{product.name}</h6>
                          <small className="text-muted">
                            ${product.price} • Stock: {product.countInStock}
                          </small>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addProductToOrder(product)}
                        disabled={product.countInStock === 0}
                      >
                        Add
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* User Selection Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search customers..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </InputGroup>
          </Form.Group>

          {usersLoading ? (
            <Loader />
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredUsers.map((user) => (
                <Card key={user._id} className="mb-2">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{user.name}</h6>
                        <small className="text-muted">{user.email}</small>
                        {user.isAdmin && (
                          <Badge bg="warning" className="ms-2">Admin</Badge>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => selectUser(user)}
                      >
                        Select
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderCreateScreen; 