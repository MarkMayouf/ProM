import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useGetOrderDetailsQuery, useGenerateInvoiceMutation, useSendInvoiceEmailMutation } from '../slices/ordersApiSlice';
import InvoiceGenerator from '../components/InvoiceGenerator';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { toast } from 'react-toastify';

const InvoiceScreen = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  
  const {
    data: order,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);
  
  const [generateInvoice] = useGenerateInvoiceMutation();
  const [sendInvoiceEmail] = useSendInvoiceEmailMutation();

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      const blob = await generateInvoice(orderId).unwrap();
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${orderId}.pdf`);
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
      setIsPdfLoading(false);
    }
  };
  
  const handleSendEmail = async (orderId, email) => {
    setIsEmailLoading(true);
    try {
      await sendInvoiceEmail({ orderId, email }).unwrap();
      toast.success(`Invoice sent to ${email}`);
      return true;
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Failed to send invoice email');
      console.error('Error sending invoice email:', err);
      throw err;
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <>
      <Meta title="Invoice" />
      <div className="invoice-screen">
        <Row>
          <Col md={12} className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <Button variant="light" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" /> Back
              </Button>
              <Button variant="outline-secondary" onClick={() => window.close()}>
                <FaTimes className="me-1" /> Close
              </Button>
            </div>
          </Col>
        </Row>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || "Error loading invoice data"}
          </Message>
        ) : !order ? (
          <Message>No order found with this ID.</Message>
        ) : (
          <>
            {!order.isPaid && (
              <Message variant="warning" className="mb-4">
                This order has not been paid yet. Invoice is provided for reference only.
              </Message>
            )}
            
            <InvoiceGenerator 
              order={order} 
              onSendEmail={handleSendEmail}
              onDownloadPdf={handleDownloadPdf}
              isPdfLoading={isPdfLoading}
              isEmailLoading={isEmailLoading}
            />
          </>
        )}
      </div>
    </>
  );
};

export default InvoiceScreen; 