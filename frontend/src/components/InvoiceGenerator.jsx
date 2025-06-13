import React, { useState, useRef } from 'react';
import { Card, Row, Col, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaPrint, FaDownload, FaEnvelope, FaCheck, FaSpinner } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';
import { toast } from 'react-toastify';

/**
 * InvoiceGenerator - Generates and displays a printable invoice for an order
 * @param {Object} order - The order object containing all order details
 * @param {Function} onSendEmail - Callback function when sending invoice via email
 * @param {Function} onDownloadPdf - Callback function for downloading PDF
 * @param {Boolean} isPdfLoading - Flag indicating if PDF is being generated
 * @param {Boolean} isEmailLoading - Flag indicating if email is being sent
 */
const InvoiceGenerator = ({ 
  order, 
  onSendEmail, 
  onDownloadPdf,
  isPdfLoading = false,
  isEmailLoading = false
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState(order?.user?.email || '');
  
  const invoiceRef = useRef();
  
  // Format date to display in a readable format
  const formatDate = (date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  };
  
  // Generate invoice number from order ID and date
  const getInvoiceNumber = () => {
    const orderDate = new Date(order.createdAt);
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const day = String(orderDate.getDate()).padStart(2, '0');
    const idPart = order._id.substring(order._id.length - 6);
    
    return `INV-${year}${month}${day}-${idPart}`;
  };
  
  // Handle printing the invoice
  const handlePrint = useReactToPrint({
    content: () => {
      // Ensure the ref is available before attempting to print
      if (!invoiceRef.current) {
        toast.error('Invoice content not ready for printing. Please try again.');
        return null;
      }
      return invoiceRef.current;
    },
    documentTitle: `Invoice_${getInvoiceNumber()}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          font-family: Arial, sans-serif !important;
          color: #000 !important;
          background: white !important;
        }
        
        .no-print {
          display: none !important;
        }
        
        .print-break {
          page-break-before: always;
        }
        
        .invoice-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        
        .card {
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .table {
          font-size: 11px !important;
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 10px 0 !important;
        }
        
        .table th, .table td {
          border: 1px solid #333 !important;
          padding: 6px 8px !important;
          text-align: left !important;
          vertical-align: top !important;
        }
        
        .table th {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
          color: #000 !important;
        }
        
        .btn, .modal, .tooltip, .popover {
          display: none !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: #000 !important;
          page-break-after: avoid;
          margin: 10px 0 !important;
        }
        
        .text-primary {
          color: #000 !important;
        }
        
        .bg-light {
          background-color: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .bg-success {
          background-color: #d4edda !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .bg-danger {
          background-color: #f8d7da !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .badge {
          border: 1px solid #000 !important;
          padding: 2px 6px !important;
          background: white !important;
          color: #000 !important;
        }
        
        .border-start {
          border-left: 3px solid #dc3545 !important;
        }
        
        .text-danger {
          color: #dc3545 !important;
        }
        
        .text-success {
          color: #28a745 !important;
        }
        
        .text-muted {
          color: #666 !important;
        }
        
        .fw-bold {
          font-weight: bold !important;
        }
        
        .small {
          font-size: 0.8em !important;
        }
        
        .ms-auto {
          margin-left: auto !important;
        }
        
        .me-1 { margin-right: 0.2rem !important; }
        .me-2 { margin-right: 0.4rem !important; }
        .mb-0 { margin-bottom: 0 !important; }
        .mb-1 { margin-bottom: 0.2rem !important; }
        .mb-2 { margin-bottom: 0.4rem !important; }
        .mb-3 { margin-bottom: 0.6rem !important; }
        .mb-4 { margin-bottom: 0.8rem !important; }
        .mb-5 { margin-bottom: 1rem !important; }
        .mt-3 { margin-top: 0.6rem !important; }
        .mt-5 { margin-top: 1rem !important; }
        .p-2 { padding: 0.4rem !important; }
        .p-3 { padding: 0.6rem !important; }
        .pt-5 { padding-top: 1rem !important; }
        
        .border-top {
          border-top: 1px solid #333 !important;
        }
        
        hr {
          border: 0;
          border-top: 1px solid #333 !important;
          margin: 1rem 0 !important;
        }
        
        .rounded {
          border-radius: 0.25rem !important;
        }
        
        .text-center {
          text-align: center !important;
        }
        
        .text-end {
          text-align: right !important;
        }
        
        .text-md-end {
          text-align: right !important;
        }
        
        .d-flex {
          display: flex !important;
        }
        
        .justify-content-between {
          justify-content: space-between !important;
        }
        
        .align-items-center {
          align-items: center !important;
        }
        
        /* Force print styles */
        .row {
          display: flex !important;
          flex-wrap: wrap !important;
          margin: 0 !important;
        }
        
        .col, .col-md-6, .col-lg-6 {
          flex: 1 !important;
          padding: 0 5px !important;
        }
        
        /* Ensure invoice content is visible */
        .invoice-printable {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }
    `,
    onBeforePrint: () => {
      console.log('Preparing invoice for printing...');
      toast.info('Preparing invoice for printing...');
      return new Promise((resolve) => {
        // Give time for styles to apply
        setTimeout(resolve, 500);
      });
    },
    onAfterPrint: () => {
      console.log('Invoice print dialog closed');
      toast.success('Invoice print dialog opened successfully!');
    },
    onPrintError: (errorLocation, error) => {
      console.error('Print error:', errorLocation, error);
      toast.error('Failed to open print dialog. Please try again or check your browser settings.');
    },
    removeAfterPrint: false, // Keep the component after printing
  });
  
  // Handle downloading the invoice as PDF
  const handleDownload = async () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    
    // If no external handler is provided, generate PDF directly
    try {
      const content = invoiceRef.current;
      const canvas = await html2canvas(content);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${getInvoiceNumber()}.pdf`);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };
  
  // Handle sending the invoice via email
  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      if (onSendEmail) {
        await onSendEmail(order._id, email);
        setEmailSent(true);
        toast.success(`Invoice sent to ${email}`);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    }
  };
  
  return (
    <>
      <div className="invoice-container">
        <div className="invoice-actions mb-4 no-print">
          <Row>
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Invoice #{getInvoiceNumber()}</h4>
                  <div>
                    <Button 
                      variant="outline-primary" 
                      className="me-2"
                      onClick={handlePrint}
                    >
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button 
                      variant="outline-success" 
                      className="me-2"
                      onClick={handleDownload}
                      disabled={isPdfLoading}
                    >
                      {isPdfLoading ? (
                        <>
                          <FaSpinner className="me-2 fa-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <FaDownload className="me-2" /> Download PDF
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline-info"
                      onClick={() => setShowEmailModal(true)}
                      disabled={isEmailLoading}
                    >
                      {isEmailLoading ? (
                        <>
                          <FaSpinner className="me-2 fa-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope className="me-2" /> Email Invoice
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
        
        {/* Printable Invoice */}
        <div className="invoice-printable" ref={invoiceRef}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              {/* Invoice Header */}
              <Row className="mb-5">
                <Col md={6}>
                  <div className="d-flex align-items-center mb-4">
                    <img 
                      src={logo} 
                      alt="ProMayouf Logo" 
                      style={{ height: '40px' }} 
                      className="me-2" 
                    />
                    <h2 className="mb-0">ProMayouf</h2>
                  </div>
                  <p className="mb-1">123 Fashion Avenue</p>
                  <p className="mb-1">New York, NY 10001</p>
                  <p className="mb-1">United States</p>
                  <p className="mb-1">Phone: (800) PRO-MAYO</p>
                  <p className="mb-1">Email: support@promayouf.com</p>
                </Col>
                
                <Col md={6} className="text-md-end">
                  <h1 className="mb-4">INVOICE</h1>
                  <p className="mb-1">
                    <strong>Invoice Number:</strong> {getInvoiceNumber()}
                  </p>
                  <p className="mb-1">
                    <strong>Order ID:</strong> {order._id}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(order.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Payment Method:</strong> {order.paymentMethod}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>{' '}
                    {order.refundProcessed ? (
                      <Badge bg="danger">
                        {order.isRefunded ? 'Fully Refunded' : 'Partially Refunded'}
                      </Badge>
                    ) : (
                      <Badge bg={order.isPaid ? 'success' : 'danger'}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    )}
                  </p>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              {/* Billing & Shipping Information */}
              <Row className="mb-5">
                <Col md={6}>
                  <h5 className="mb-3">Bill To:</h5>
                  <p className="mb-1">
                    <strong>{order.user.name}</strong>
                  </p>
                  <p className="mb-1">{order.user.email}</p>
                </Col>
                
                <Col md={6}>
                  <h5 className="mb-3">Ship To:</h5>
                  <p className="mb-1">
                    <strong>{order.shippingAddress.address}</strong>
                  </p>
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="mb-1">{order.shippingAddress.country}</p>
                </Col>
              </Row>
              
              {/* Order Items */}
              <h5 className="mb-3">Order Items:</h5>
              <Table striped responsive className="mb-4">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <div>
                          <strong>{item.name}</strong>
                          {item.color && (
                            <div className="small text-muted">Color: {item.color}</div>
                          )}
                          {item.size && (
                            <div className="small text-muted">Size: {item.size}</div>
                          )}
                        </div>
                      </td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-end">${Number(item.price).toFixed(2)}</td>
                      <td className="text-end">${Number(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Order Summary */}
              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h5 className="mb-3">Notes:</h5>
                    <p className="mb-0">
                      Thank you for your purchase! For any inquiries regarding this invoice,
                      please contact our customer support team.
                    </p>
                    {order.refundProcessed && (
                      <div className="mt-3 p-3 bg-light border-start border-danger border-4">
                        <h6 className="text-danger mb-2">Refund Information</h6>
                        <p className="mb-1">
                          <strong>Refund Amount:</strong> ${Number(order.refundAmount).toFixed(2)}
                        </p>
                        <p className="mb-1">
                          <strong>Refund Date:</strong> {formatDate(order.refundDate)}
                        </p>
                        <p className="mb-0">
                          <strong>Reason:</strong> {order.refundReason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <h5 className="mb-3">Shipping Information:</h5>
                      <p className="mb-1">
                        <strong>Carrier:</strong> {order.shippingCarrier || 'Standard Shipping'}
                      </p>
                      <p className="mb-1">
                        <strong>Tracking Number:</strong> {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </Col>
                
                <Col md={6}>
                  <div className="invoice-summary ms-auto" style={{ maxWidth: '300px' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>${Number(order.itemsPrice).toFixed(2)}</span>
                    </div>
                    
                    {order.discountAmount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-danger">
                        <span>Discount:</span>
                        <span>-${Number(order.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span>Shipping:</span>
                      <span>${Number(order.shippingPrice).toFixed(2)}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax:</span>
                      <span>${Number(order.taxPrice).toFixed(2)}</span>
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between mb-2 fw-bold">
                      <span>Total:</span>
                      <span>${Number(order.totalPrice).toFixed(2)}</span>
                    </div>
                    
                    {order.refundProcessed && (
                      <div className="d-flex justify-content-between mt-3 p-2 bg-danger text-white rounded">
                        <span>Refunded:</span>
                        <span>-${Number(order.refundAmount).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {order.isPaid && (
                      <div className="d-flex justify-content-between mt-3 p-2 bg-success text-white rounded">
                        <span>Paid on:</span>
                        <span>{formatDate(order.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              {/* Footer */}
              <div className="mt-5 pt-5 text-center text-muted small border-top">
                <p className="mb-1">
                  This is an electronically generated invoice and does not require a signature.
                </p>
                <p>
                  &copy; {new Date().getFullYear()} ProMayouf Company. All rights reserved.
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Email Modal */}
      <Modal show={showEmailModal} onHide={() => !isEmailLoading && setShowEmailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Invoice via Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {emailSent ? (
            <div className="text-center py-3">
              <FaCheck size={50} className="text-success mb-3" />
              <h5 className="mb-3">Invoice Sent Successfully!</h5>
              <p className="text-muted mb-0">
                The invoice has been sent to {email}
              </p>
            </div>
          ) : (
            <>
              <p>
                Enter the email address where you'd like to receive this invoice:
              </p>
              <Form.Group>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  isInvalid={email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                />
                <Form.Control.Feedback type="invalid">
                  Please enter a valid email address
                </Form.Control.Feedback>
                <Form.Text className="text-muted mt-2">
                  We'll never share your email with anyone else.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        {!emailSent && (
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowEmailModal(false)}
              disabled={isEmailLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSendEmail}
              disabled={isEmailLoading || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            >
              {isEmailLoading ? (
                <>
                  <FaSpinner className="fa-spin me-2" /> Sending...
                </>
              ) : (
                'Send Invoice'
              )}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

export default InvoiceGenerator;
