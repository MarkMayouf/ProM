import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  Row,
  Col,
  ListGroup,
  Image,
  Card,
  Button,
  Tab,
  Nav,
  Accordion,
  Badge,
  Form,
  Spinner,
} from 'react-bootstrap';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Message from '../components/Message';
import Loader from '../components/Loader';
import InvoiceGenerator from '../components/InvoiceGenerator';
import ShippingTracker from '../components/ShippingTracker';
import {
  FaFileInvoice,
  FaTruck,
  FaReceipt,
  FaDownload,
  FaEnvelope,
  FaEdit,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaShippingFast,
  FaBoxOpen,
  FaCreditCard,
  FaCommentDots,
  FaCheckCircle,
  FaInfoCircle,
  FaClock,
} from 'react-icons/fa';
import {
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  useGetPaypalClientIdQuery,
  usePayOrderMutation,
  useUpdateOrderTrackingMutation,
  useUpdateOrderNotesMutation,
  useRefundOrderMutation,
  useResendOrderConfirmationMutation,
  useGenerateInvoiceMutation,
  useSendInvoiceEmailMutation,
  // We need a way to get the Stripe publishable key, let's assume it's added to ordersApiSlice or a new slice
  // For now, let's mock it or fetch it directly if an endpoint exists
} from '../slices/ordersApiSlice'; // Assuming new mutations for tracking, notes, refunds and email resending
import { clearCartItems } from '../slices/cartSlice';

// Stripe functionality removed

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const [adminNotes, setAdminNotes] = useState('');
  const { state } = useLocation();
  const [activeTab, setActiveTab] = useState(state?.tab || 'details');
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] =
    useDeliverOrderMutation();
  const [updateTracking, { isLoading: loadingTracking }] =
    useUpdateOrderTrackingMutation();
  const [updateNotes, { isLoading: loadingNotes }] =
    useUpdateOrderNotesMutation();
  const [refundOrder, { isLoading: loadingRefund }] = useRefundOrderMutation();
  const [resendConfirmation, { isLoading: loadingResend }] =
    useResendOrderConfirmationMutation();
  const [generateInvoice] = useGenerateInvoiceMutation();
  const [sendInvoiceEmail] = useSendInvoiceEmailMutation();

  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: paypalConfig,
    isLoading: loadingPayPalConfig,
    error: errorPayPalConfig,
  } = useGetPaypalClientIdQuery();

  const [{ isPending: loadingPayPalUI }, paypalDispatch] = usePayPalScriptReducer({
    'client-id': paypalConfig?.clientId || '',
    currency: 'USD'
  });

  // Stripe state removed

  const dispatch = useDispatch();

  useEffect(() => {
    if (order && userInfo && userInfo.isAdmin) {
      setAdminNotes(order.adminNotes || '');
      if (order.refundAmount) {
        setRefundAmount(order.refundAmount);
      } else {
        setRefundAmount(order.totalPrice);
      }
    }
  }, [order, userInfo]);

  // Stripe useEffect removed

  useEffect(() => {
    if (!errorPayPalConfig && !loadingPayPalConfig && paypalConfig?.clientId) {
      const loadPaypalScript = async () => {
        paypalDispatch({
          type: 'resetOptions',
          value: {
            'client-id': paypalConfig.clientId,
            currency: 'USD', // Should ideally come from order.currency or a config
          },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
      };
      if (order && !order.isPaid && order.paymentMethod === 'PayPal') {
        if (!window.paypal) {
          loadPaypalScript();
        }
      }
    }
  }, [
    errorPayPalConfig,
    loadingPayPalConfig,
    order,
    paypalConfig,
    paypalDispatch,
  ]);

  function onApprovePayPal(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        await payOrderHandler('PayPal', details);
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'PayPal payment failed');
      }
    });
  }

  function onErrorPayPal(err) {
    toast.error(err.message || 'PayPal payment error');
  }

  function createPayPalOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { 
              value: order.totalPrice.toString(),
              currency_code: 'USD'
            },
            description: `Order #${order._id.substring(order._id.length - 6)}`
          },
        ],
        application_context: {
          shipping_preference: 'NO_SHIPPING'
        }
      })
      .then((orderID) => {
        return orderID;
      });
  }

  // Stripe payment handlers removed

  const deliverHandler = async () => {
    try {
      await deliverOrder(orderId).unwrap();
      refetch();
      toast.success('Order marked as delivered');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleUpdateTrackingInfo = async (orderId, trackingInfo) => {
    try {
      await updateTracking({ orderId, trackingInfo }).unwrap();
      refetch();
      toast.success('Tracking information updated successfully');
    } catch (err) {
      toast.error(
        err?.data?.message ||
          err.error ||
          'Failed to update tracking information'
      );
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await updateNotes({ orderId, adminNotes }).unwrap();
      refetch();
      toast.success('Admin notes updated successfully');
    } catch (err) {
      toast.error(
        err?.data?.message || err.error || 'Failed to update admin notes'
      );
    }
  };

  const handleProcessRefund = async () => {
    if (!refundReason) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    try {
      await refundOrder({
        orderId,
        refundAmount,
        refundReason,
      }).unwrap();
      refetch();
      setShowRefundConfirm(false);
      toast.success(
        `Refund of $${refundAmount.toFixed(2)} processed successfully`
      );
    } catch (err) {
      toast.error(
        err?.data?.message || err.error || 'Failed to process refund'
      );
    }
  };

  const handleResendOrderConfirmation = async () => {
    try {
      await resendConfirmation(orderId).unwrap();
      toast.success('Order confirmation email resent successfully');
    } catch (err) {
      toast.error(
        err?.data?.message || err.error || 'Failed to resend confirmation email'
      );
    }
  };

  const handleSendInvoiceEmail = async (orderId, email) => {
    if (!email) {
      toast.error('Please provide a valid email address');
      return;
    }
    
    setEmailLoading(true);
    try {
      await sendInvoiceEmail({ orderId, email }).unwrap();
      toast.success(`Invoice sent to ${email}`);
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to send invoice email');
      console.error('Error sending invoice:', err);
    } finally {
      setEmailLoading(false);
    }
  };
  
  const handleDownloadInvoice = async () => {
    setPdfLoading(true);
    try {
      const blob = await generateInvoice(orderId).unwrap();
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Failed to download invoice');
      console.error('Error downloading invoice:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const payOrderHandler = async (paymentMethod, paymentDetails) => {
    try {
      setErrorMessage('');
      
      // Log the payment details for debugging
      console.log('Payment method:', paymentMethod);
      console.log('Payment details:', paymentDetails);
      
      let details;
      
      // Format the payload based on payment method
      if (paymentMethod === 'PayPal') {
        details = {
          paymentSource: paymentMethod,
          id: paymentDetails.id,
          status: paymentDetails.status,
          update_time: paymentDetails.update_time,
          payer: paymentDetails.payer
        };
      } else {
        // For other payment methods
        details = {
          paymentSource: paymentMethod,
          ...paymentDetails
        };
      }
      
      const paymentPayload = {
        orderId: orderId,
        details: details
      };
      
      console.log('Sending payment payload:', paymentPayload);
      
      await payOrder(paymentPayload).unwrap();
      refetch();
      toast.success('Payment successful!');
      dispatch(clearCartItems());
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(err?.data?.message || err.message || 'Something went wrong with the payment.');
      toast.error(err?.data?.message || err.message || 'Payment failed. Please try again.');
    }
  };

  // Helper functions
  const getCarrierTrackingUrl = (carrier, trackingNumber) => {
    const carriers = {
      'FedEx': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return carriers[carrier] || '#';
  };

  const getShippingStatusVariant = (status) => {
    const variantMap = {
      'processing': 'info',
      'packed': 'primary',
      'shipped': 'primary',
      'in_transit': 'primary',
      'out_for_delivery': 'warning',
      'delivered': 'success',
      'exception': 'danger',
      'returned': 'danger',
    };
    return variantMap[status] || 'secondary';
  };

  const formatShippingStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading || loadingPayPalConfig)
    return <Loader />;
  if (error)
    return (
      <Message variant='danger'>{error?.data?.message || error.error}</Message>
    );
  if (errorPayPalConfig)
    return <Message variant='danger'>Could not load PayPal config.</Message>;

  return (
    <>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          Order {order._id.substring(order._id.length - 6)}
          {order.isPaid && !order.refundProcessed && (
            <Badge bg='success' className='ms-2'>
              Paid
            </Badge>
          )}
          {order.refundProcessed && (
            <Badge bg='danger' className='ms-2'>
              {order.isRefunded ? 'Fully Refunded' : 'Partially Refunded'}
            </Badge>
          )}
          {order.isDelivered && !order.refundProcessed && (
            <Badge bg='success' className='ms-2'>
              Delivered
            </Badge>
          )}
          {!order.isPaid && !order.refundProcessed && (
            <Badge bg='danger' className='ms-2'>
              Unpaid
            </Badge>
          )}
          {order.isPaid && !order.isDelivered && !order.refundProcessed && (
            <Badge bg='warning' className='ms-2'>
              Pending Delivery
            </Badge>
          )}
        </h1>

        {userInfo && userInfo.isAdmin && (
          <div>
            <Button
              variant='outline-primary'
              className='me-2'
              onClick={handleResendOrderConfirmation}
              disabled={loadingResend}
            >
              <FaEnvelope className='me-1' />
              {loadingResend ? 'Sending...' : 'Resend Confirmation'}
            </Button>

            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
              <Nav variant='pills' className='d-inline-flex'>
                <Nav.Item>
                  <Nav.Link eventKey='details' className='px-3 py-1'>
                    <FaBoxOpen className='me-1' /> Details
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey='invoice' className='px-3 py-1'>
                    <FaFileInvoice className='me-1' /> Invoice
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey='tracking' className='px-3 py-1'>
                    <FaTruck className='me-1' /> Tracking
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Tab.Container>
          </div>
        )}
      </div>

      {userInfo && userInfo.isAdmin && (
        <Tab.Content>
          <Tab.Pane eventKey='details' active={activeTab === 'details'}>
            {/* Order details content - will show by default below */}
          </Tab.Pane>

          <Tab.Pane eventKey='invoice' active={activeTab === 'invoice'}>
            <InvoiceGenerator
              order={order}
              onSendEmail={handleSendInvoiceEmail}
              onDownloadPdf={handleDownloadInvoice}
              isPdfLoading={pdfLoading}
              isEmailLoading={emailLoading}
              invoiceType='Invoice'
            />
          </Tab.Pane>

          <Tab.Pane eventKey='tracking' active={activeTab === 'tracking'}>
            <ShippingTracker
              order={order}
              isAdmin={userInfo.isAdmin}
              onUpdateTracking={handleUpdateTrackingInfo}
            />
          </Tab.Pane>
        </Tab.Content>
      )}

      {/* Only show the main order details if we're not viewing invoice or tracking tabs */}
      {(!userInfo || !userInfo.isAdmin || activeTab === 'details') && (
        <Row>
          <Col md={8}>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Shipping & Tracking</h2>
                <p>
                  <strong>Name: </strong> {order.user.name}
                </p>
                <p>
                  <strong>Email: </strong>
                  <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
                </p>
                <p>
                  <strong>Address:</strong>
                  {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                  {order.shippingAddress.postalCode},{' '}
                  {order.shippingAddress.country}
                </p>
                
                {/* Enhanced Tracking Information */}
                {order.trackingNumber && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="mb-3">
                      <FaTruck className="me-2" />
                      Tracking Information
                    </h6>
                    <Row>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Carrier: </strong>
                          {order.shippingCarrier || 'Standard Shipping'}
                        </p>
                        <p className="mb-1">
                          <strong>Tracking Number: </strong>
                          <span className="font-monospace">{order.trackingNumber}</span>
                        </p>
                        {order.estimatedDelivery && (
                          <p className="mb-1">
                            <strong>Estimated Delivery: </strong>
                            {new Date(order.estimatedDelivery).toLocaleDateString()}
                          </p>
                        )}
                      </Col>
                      <Col md={6} className="text-end">
                        {order.shippingCarrier && (
                          <div className="d-flex flex-column gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              href={getCarrierTrackingUrl(order.shippingCarrier, order.trackingNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaTruck className="me-1" />
                              Track on {order.shippingCarrier}
                            </Button>
                            <Link to={`/track/${order._id}`}>
                              <Button variant="outline-info" size="sm">
                                <FaInfoCircle className="me-1" />
                                Detailed Tracking
                              </Button>
                            </Link>
                          </div>
                        )}
                      </Col>
                    </Row>
                    
                    {/* Shipping Status */}
                    {order.shippingStatus && (
                      <div className="mt-3">
                        <Badge 
                          bg={getShippingStatusVariant(order.shippingStatus)} 
                          className="p-2"
                        >
                          {formatShippingStatus(order.shippingStatus)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Delivery Status */}
                {order.isDelivered ? (
                  <Message variant='success' className="mt-3">
                    <FaCheckCircle className="me-2" />
                    Delivered on{' '}
                    {new Date(order.deliveredAt).toLocaleDateString()}
                    {order.deliveredAt && (
                      <div className="mt-2">
                        <small className="text-muted">
                          You can now request returns for delivered items
                        </small>
                      </div>
                    )}
                  </Message>
                ) : order.trackingNumber ? (
                  <Message variant='info' className="mt-3">
                    <FaTruck className="me-2" />
                    Your order has been shipped and is in transit
                  </Message>
                ) : (
                  <Message variant='warning' className="mt-3">
                    <FaClock className="me-2" />
                    Your order is being prepared for shipping
                  </Message>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Payment Method</h2>
                <p>
                  <strong>Method: </strong>
                  {order.paymentMethod}
                </p>
                {order.isPaid ? (
                  <Message variant='success'>
                    Paid on {new Date(order.paidAt).toLocaleDateString()}
                  </Message>
                ) : (
                  <Message variant='danger'>Not Paid</Message>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Order Items</h2>
                {order.orderItems.length === 0 ? (
                  <Message>Order is empty</Message>
                ) : (
                  <ListGroup variant='flush'>
                    {order.orderItems.map((item, index) => (
                      <ListGroup.Item key={index}>
                        <Row>
                          <Col md={1}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fluid
                              rounded
                            />
                          </Col>
                          <Col>
                            <Link to={`/product/${item.product}`}>
                              {item.name}
                            </Link>
                            {item.color && (
                              <span className='ms-2 small text-muted'>
                                Color: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className='ms-2 small text-muted'>
                                Size: {item.size}
                              </span>
                            )}
                          </Col>
                          <Col md={4}>
                            {item.qty} x ${item.price.toFixed(2)} = $
                            {(item.qty * item.price).toFixed(2)}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </ListGroup.Item>

              {/* Admin notes section - only visible to admins */}
              {userInfo && userInfo.isAdmin && (
                <ListGroup.Item>
                  <Accordion>
                    <Accordion.Item eventKey='0'>
                      <Accordion.Header>
                        <FaCommentDots className='me-2' /> Admin Notes
                      </Accordion.Header>
                      <Accordion.Body>
                        <Form>
                          <Form.Group className='mb-3'>
                            <Form.Control
                              as='textarea'
                              rows={3}
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder='Add internal notes about this order (not visible to customer)'
                            />
                          </Form.Group>
                          <Button
                            variant='primary'
                            size='sm'
                            onClick={handleUpdateNotes}
                            disabled={loadingNotes}
                          >
                            {loadingNotes ? 'Saving...' : 'Save Notes'}
                          </Button>
                        </Form>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h2>Order Summary</h2>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>${order.itemsPrice.toFixed(2)}</Col>
                  </Row>
                </ListGroup.Item>

                {order.discountAmount > 0 && (
                  <ListGroup.Item className="discount-item">
                    <div className="discount-header">
                      <Row>
                        <Col>Discount</Col>
                        <Col className='text-danger fw-bold'>
                          -${order.discountAmount.toFixed(2)}
                        </Col>
                      </Row>
                    </div>
                    {order.couponCode && (
                      <div className="discount-details">
                        <Row>
                          <Col className='text-muted'>
                            <div className="coupon-badge">
                              <span className="coupon-code">{order.couponCode}</span>
                            </div>
                          </Col>
                        </Row>
                        <Row className="mt-2">
                          <Col>
                            <div className="savings-message">
                              You saved ${order.discountAmount.toFixed(2)} on this order!
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </ListGroup.Item>
                )}

                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>${order.shippingPrice.toFixed(2)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Tax</Col>
                    <Col>${order.taxPrice.toFixed(2)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Total</Col>
                    <Col>${order.totalPrice.toFixed(2)}</Col>
                  </Row>
                </ListGroup.Item>

                {!order.isPaid && (
                  <ListGroup.Item>
                    {loadingPay && <Loader />}
                    {order.paymentMethod === 'PayPal' &&
                      (loadingPayPalUI ? (
                        <Loader />
                      ) : (
                        <div>
                          <PayPalButtons
                            createOrder={createPayPalOrder}
                            onApprove={onApprovePayPal}
                            onError={onErrorPayPal}
                          ></PayPalButtons>
                        </div>
                      ))}
                    {order.paymentMethod === 'Stripe' && (
                        <Message variant='warning'>
                          Stripe payment method is no longer available. Please contact support.
                        </Message>
                      )}
                  </ListGroup.Item>
                )}

                {/* Admin actions section */}
                {userInfo && userInfo.isAdmin && (
                  <>
                    {loadingDeliver && <Loader />}

                    {order.isPaid && !order.isDelivered && (
                      <ListGroup.Item>
                        <Button
                          type='button'
                          className='btn btn-block w-100'
                          onClick={deliverHandler}
                        >
                          <FaShippingFast className='me-1' /> Mark As Delivered
                        </Button>
                      </ListGroup.Item>
                    )}

                    {order.isPaid && !order.refundProcessed && (
                      <ListGroup.Item>
                        {showRefundConfirm ? (
                          <div>
                            <h6 className='mb-3'>Process Refund</h6>
                            <Form.Group className='mb-3'>
                              <Form.Label>Refund Amount ($)</Form.Label>
                              <Form.Control
                                type='number'
                                step='0.01'
                                min='0.01'
                                max={order.totalPrice}
                                value={refundAmount}
                                onChange={(e) =>
                                  setRefundAmount(Number(e.target.value))
                                }
                              />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                              <Form.Label>Reason for Refund</Form.Label>
                              <Form.Control
                                as='textarea'
                                rows={2}
                                value={refundReason}
                                onChange={(e) =>
                                  setRefundReason(e.target.value)
                                }
                                placeholder='Required: Explain reason for refund'
                              />
                            </Form.Group>
                            <div className='d-flex justify-content-between'>
                              <Button
                                variant='secondary'
                                size='sm'
                                onClick={() => setShowRefundConfirm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant='danger'
                                size='sm'
                                onClick={handleProcessRefund}
                                disabled={loadingRefund}
                              >
                                {loadingRefund
                                  ? 'Processing...'
                                  : 'Process Refund'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type='button'
                            className='btn btn-danger btn-block w-100'
                            onClick={() => setShowRefundConfirm(true)}
                          >
                            <FaCreditCard className='me-1' /> Process Refund
                          </Button>
                        )}
                      </ListGroup.Item>
                    )}

                    {order.refundProcessed && (
                      <ListGroup.Item>
                        <div className='text-danger'>
                          <FaExclamationTriangle className='me-1' />
                          Refunded: ${order.refundAmount?.toFixed(2) || 'N/A'}
                          <p className='small text-muted mt-1 mb-0'>
                            {order.refundReason}
                          </p>
                        </div>
                      </ListGroup.Item>
                    )}

                    <ListGroup.Item>
                      <div className='d-grid gap-2'>
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => setActiveTab('invoice')}
                        >
                          <FaFileInvoice className='me-1' /> View Invoice
                        </Button>
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => setActiveTab('tracking')}
                        >
                          <FaTruck className='me-1' /> View/Update Tracking
                        </Button>
                      </div>
                    </ListGroup.Item>
                  </>
                )}

                {/* Show receipt button to customer */}
                {userInfo && order.isPaid && !userInfo.isAdmin && (
                  <ListGroup.Item>
                    <div className="d-grid gap-2">
                      <Link
                        to={`/order/${order._id}/receipt`}
                        className='btn btn-outline-primary btn-sm'
                      >
                        <FaReceipt className='me-1' /> View Receipt
                      </Link>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        onClick={handleDownloadInvoice}
                        disabled={pdfLoading}
                      >
                        {pdfLoading ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Generating PDF...
                          </>
                        ) : (
                          <>
                            <FaDownload className='me-1' /> Download Invoice
                          </>
                        )}
                      </Button>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default OrderScreen;
<style jsx="true">{`
  .discount-item {
    background-color: #f8fff8;
    border-left: 3px solid #28a745;
  }
  
  .discount-header {
    font-weight: 500;
  }
  
  .discount-details {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #dee2e6;
  }
  
  .coupon-badge {
    display: inline-block;
    background-color: #e8f4f8;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a2c42;
  }
  
  .savings-message {
    font-size: 0.9rem;
    color: #28a745;
    font-weight: 500;
  }
`}</style>

