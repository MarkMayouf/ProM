import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  ListGroup,
  Table,
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaPrint,
  FaDownload,
  FaCheckCircle,
} from 'react-icons/fa';
import { useGetOrderDetailsQuery } from '../slices/ordersApiSlice';
import { toast } from 'react-toastify';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Meta from '../components/Meta';
import logo from '../assets/logo.png';

const ReceiptScreen = () => {
  const { id: orderId } = useParams();
  const receiptRef = useRef();

  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);

  // Generate receipt number with prefix RCP followed by order id
  const receiptNumber = order
    ? `RCP-${order._id.substring(order._id.length - 6)}`
    : '';

  // Handle print functionality
  const handlePrint = () => {
    try {
      toast.info('Preparing receipt for printing...');
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const receiptContent = receiptRef.current.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ProMayouf Receipt ${receiptNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .receipt { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .text-end { 
              text-align: right; 
            }
            .text-center { 
              text-align: center; 
            }
            .mb-1 { 
              margin-bottom: 5px; 
            }
            .mb-2 { 
              margin-bottom: 10px; 
            }
            .mb-3 { 
              margin-bottom: 15px; 
            }
            .mb-4 { 
              margin-bottom: 20px; 
            }
            .border-start { 
              border-left: 3px solid #007bff; 
              padding-left: 10px;
            }
            .bg-light { 
              background-color: #f8f9fa; 
            }
            .p-3 { 
              padding: 15px; 
            }
            .rounded { 
              border-radius: 5px; 
            }
            .border-top { 
              border-top: 1px solid #ddd; 
              padding-top: 15px;
            }
            .text-primary { 
              color: #007bff; 
            }
            .text-muted { 
              color: #6c757d; 
            }
            .fw-bold { 
              font-weight: bold; 
            }
            .small { 
              font-size: 0.875em; 
            }
            img { 
              max-width: 40px; 
              height: auto; 
            }
            .no-print { 
              display: none; 
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Receipt opened for printing!');
      
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt. Please try again.');
    }
  };

  // Handle download functionality
  const handleDownload = () => {
    try {
      toast.info('Preparing receipt for download...');
      
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      const receiptContent = receiptRef.current.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ProMayouf Receipt ${receiptNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .receipt { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .text-end { 
              text-align: right; 
            }
            .text-center { 
              text-align: center; 
            }
            .mb-1 { 
              margin-bottom: 5px; 
            }
            .mb-2 { 
              margin-bottom: 10px; 
            }
            .mb-3 { 
              margin-bottom: 15px; 
            }
            .mb-4 { 
              margin-bottom: 20px; 
            }
            .border-start { 
              border-left: 3px solid #007bff; 
              padding-left: 10px;
            }
            .bg-light { 
              background-color: #f8f9fa; 
            }
            .p-3 { 
              padding: 15px; 
            }
            .rounded { 
              border-radius: 5px; 
            }
            .border-top { 
              border-top: 1px solid #ddd; 
              padding-top: 15px;
            }
            .text-primary { 
              color: #007bff; 
            }
            .text-muted { 
              color: #6c757d; 
            }
            .fw-bold { 
              font-weight: bold; 
            }
            .small { 
              font-size: 0.875em; 
            }
            img { 
              max-width: 40px; 
              height: auto; 
            }
            .no-print { 
              display: none; 
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Receipt opened for download! Choose "Save as PDF" in the print dialog.');
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt. Please try again.');
    }
  };

  // Format date as MM/DD/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant='danger'>{error?.data?.message || error.error}</Message>
    );
  if (!order || !order.isPaid)
    return (
      <Container>
        <Meta title='Receipt Not Available' />
        <Card className='my-5 p-5 text-center'>
          <Card.Body>
            <h2>Receipt Not Available</h2>
            <p>This order has not been paid yet or does not exist.</p>
            <Link to='/profile' className='btn btn-primary mt-3'>
              <FaArrowLeft className='me-2' /> Return to My Orders
            </Link>
          </Card.Body>
        </Card>
      </Container>
    );

  return (
    <Container className='py-4'>
      <Meta title={`Receipt #${receiptNumber}`} />
      <Row className='mb-4'>
        <Col md={8}>
          <h1 className='mb-0'>Receipt</h1>
          <p className='text-muted'>Thank you for your purchase!</p>
        </Col>
        <Col
          md={4}
          className='text-end d-flex justify-content-end align-items-center'
        >
          <Button
            variant='outline-primary'
            className='me-2 no-print'
            onClick={handlePrint}
          >
            <FaPrint className='me-1' /> Print
          </Button>
          <Button 
            variant='outline-primary' 
            className='no-print'
            onClick={handleDownload}
          >
            <FaDownload className='me-1' /> Download PDF
          </Button>
        </Col>
      </Row>

      <Card className='mb-4 border-0 shadow-sm'>
        <Card.Body className='p-4'>
          <div ref={receiptRef} className='receipt'>
            <div className='p-4'>
              {/* Receipt Header */}
              <Row className='mb-4'>
                <Col md={6}>
                  <div className='d-flex align-items-center mb-3'>
                    <img
                      src={logo}
                      alt='ProMayouf'
                      style={{ height: '40px', marginRight: '10px' }}
                    />
                    <div>
                      <h4 className='mb-0'>ProMayouf</h4>
                      <p className='text-muted mb-0'>Premium Men's Fashion</p>
                    </div>
                  </div>
                  <div>
                    <p className='mb-1'>123 Fashion Street, Suite 100</p>
                    <p className='mb-1'>New York, NY 10001</p>
                    <p className='mb-1'>support@promayouf.com</p>
                  </div>
                </Col>
                <Col md={6} className='text-md-end'>
                  <h5 className='text-uppercase text-primary mb-2'>
                    <FaCheckCircle className='me-2' /> Receipt
                  </h5>
                  <p className='mb-1'>
                    <strong>Receipt #:</strong> {receiptNumber}
                  </p>
                  <p className='mb-1'>
                    <strong>Order ID:</strong> {order._id}
                  </p>
                  <p className='mb-1'>
                    <strong>Date:</strong>{' '}
                    {formatDate(order.paidAt || order.createdAt)}
                  </p>
                  <p className='mb-1'>
                    <strong>Payment Method:</strong> {order.paymentMethod}
                  </p>
                </Col>
              </Row>

              {/* Customer Information */}
              <Row className='mb-4'>
                <Col md={12}>
                  <h5 className='mb-2'>Bill To:</h5>
                  <div className='p-2 border-start border-primary border-3'>
                    <p className='mb-1'>
                      <strong>Name:</strong> {order.user.name}
                    </p>
                    <p className='mb-1'>
                      <strong>Email:</strong> {order.user.email}
                    </p>
                    <p className='mb-1'>
                      <strong>Shipping Address:</strong>
                      <br />
                      {order.shippingAddress.address}
                      <br />
                      {order.shippingAddress.city},{' '}
                      {order.shippingAddress.postalCode}
                      <br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                </Col>
              </Row>

              {/* Order Items */}
              <h5 className='mb-3'>Items Purchased:</h5>
              <Table striped bordered className='mb-4'>
                <thead className='bg-light'>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th className='text-center'>Quantity</th>
                    <th className='text-end'>Price</th>
                    <th className='text-end'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '40px', marginRight: '10px' }}
                            className='img-thumbnail'
                          />
                          <div>
                            {item.name}
                            {item.color && (
                              <span className='ms-2 text-muted small'>
                                Color: {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className='ms-2 text-muted small'>
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='text-center'>{item.qty}</td>
                      <td className='text-end'>${item.price.toFixed(2)}</td>
                      <td className='text-end'>
                        ${(item.qty * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Order Summary */}
              <Row>
                <Col md={7}>
                  <div className='mb-4'>
                    <h6 className='mb-2'>Thank You Note:</h6>
                    <div className='p-3 bg-light rounded'>
                      <p className='mb-0'>
                        Thank you for shopping with ProMayouf. We value your
                        business!
                        <br />
                        {order.isCustomized && (
                          <span className='text-primary mt-2 d-block'>
                            This order includes custom alterations. Altered
                            items cannot be returned.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className='mt-3'>
                      <h6 className='mb-2'>Return Policy:</h6>
                      <p className='small text-muted mb-0'>
                        Items may be returned within 30 days of purchase with
                        receipt. Custom-tailored items are not eligible for
                        return. Please visit our website for complete return
                        policy details.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={5}>
                  <div className='bg-light p-3 rounded'>
                    <ListGroup variant='flush'>
                      <ListGroup.Item className='bg-light d-flex justify-content-between px-0'>
                        <span>Subtotal:</span>
                        <span>${order.itemsPrice.toFixed(2)}</span>
                      </ListGroup.Item>
                      {order.discountAmount > 0 && (
                        <ListGroup.Item className='bg-light d-flex justify-content-between px-0'>
                          <span>Discount:</span>
                          <span className='text-danger'>
                            -${order.discountAmount.toFixed(2)}
                          </span>
                        </ListGroup.Item>
                      )}
                      <ListGroup.Item className='bg-light d-flex justify-content-between px-0'>
                        <span>Shipping:</span>
                        <span>${order.shippingPrice.toFixed(2)}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className='bg-light d-flex justify-content-between px-0'>
                        <span>Tax:</span>
                        <span>${order.taxPrice.toFixed(2)}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className='bg-light d-flex justify-content-between px-0 fw-bold'>
                        <span>Total:</span>
                        <span>${order.totalPrice.toFixed(2)}</span>
                      </ListGroup.Item>
                    </ListGroup>
                  </div>
                </Col>
              </Row>

              {/* Footer */}
              <div className='text-center mt-4 pt-4 border-top'>
                <p className='mb-0'>
                  This is your official receipt. Thank you for your purchase!
                </p>
                <p className='small text-muted'>
                  For any questions, please contact our customer support at
                  support@promayouf.com
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className='text-center my-4'>
        <Link to='/profile' className='btn btn-outline-primary'>
          <FaArrowLeft className='me-2' /> Back to Orders
        </Link>
      </div>
    </Container>
  );
};

export default ReceiptScreen;
