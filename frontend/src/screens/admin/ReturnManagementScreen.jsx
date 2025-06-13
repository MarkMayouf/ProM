import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  Modal,
  Alert,
  Tabs,
  Tab,
  ListGroup,
  Image,
  InputGroup,
  ProgressBar,
  Pagination
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaBox,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaDollarSign,
  FaShippingFast,
  FaExclamationTriangle,
  FaClock,
  FaChartPie,
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaBoxOpen,
  FaUndo,
  FaStar,
  FaComment,
  FaDownload,
  FaTruck
} from 'react-icons/fa';
import {
  useGetReturnsQuery,
  useGetReturnStatsQuery,
  useGetReturnByIdQuery,
  useUpdateReturnStatusMutation,
  useProcessReturnRefundMutation,
  useAddQualityCheckMutation
} from '../../slices/returnApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ReturnManagementScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Handle URL parameters for status filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam) {
      setSelectedStatus(statusParam);
      setActiveTab('returns-list'); // Switch to returns list tab when status is specified
      
      // Show notification if filtering by pending
      if (statusParam === 'pending') {
        toast.info('Showing pending return requests that need your attention', {
          autoClose: 5000,
          position: 'top-center'
        });
      }
    }
  }, []);
  
  // Quality check form state
  const [qualityNotes, setQualityNotes] = useState('');
  const [qualityRating, setQualityRating] = useState(5);
  const [qualityItems, setQualityItems] = useState([]);
  
  // Refund form state
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');

  const {
    data: returnsData,
    isLoading: returnsLoading,
    error: returnsError,
    refetch: refetchReturns
  } = useGetReturnsQuery({
    pageNumber: currentPage,
    status: selectedStatus,
    search: searchTerm
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError
  } = useGetReturnStatsQuery();

  const [updateReturnStatus] = useUpdateReturnStatusMutation();
  const [processRefund] = useProcessReturnRefundMutation();
  const [addQualityCheck] = useAddQualityCheckMutation();

  const returnStatuses = [
    { value: '', label: 'All Returns', color: 'secondary' },
    { value: 'pending', label: 'Pending Review', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'danger' },
    { value: 'received', label: 'Items Received', color: 'info' },
    { value: 'inspecting', label: 'Quality Check', color: 'primary' },
    { value: 'refunded', label: 'Refunded', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'dark' }
  ];

  const handleStatusUpdate = async (returnId, newStatus, notes = '') => {
    try {
      await updateReturnStatus({ id: returnId, status: newStatus, notes }).unwrap();
      
      // Enhanced context-aware feedback based on status
      const statusMessages = {
        'approved': 'Return approved! Customer will receive shipping label and instructions.',
        'rejected': 'Return rejected. Customer will be notified with reason.',
        'shipped_back': 'Return shipping confirmed. Awaiting package arrival.',
        'received': 'Return package received. Starting quality inspection.',
        'inspecting': 'Quality check initiated. Items being evaluated.',
        'approved_refund': 'Items approved for refund after quality check.',
        'refund_processed': 'Refund processed and sent to customer.',
        'completed': 'Return process completed successfully.',
        'cancelled': 'Return request cancelled.'
      };
      
      toast.success(statusMessages[newStatus] || `Return status updated to ${newStatus}`);
      refetchReturns();
      
      // Auto-generate shipping label for approved returns
      if (newStatus === 'approved') {
        handleGenerateShippingLabel(returnId);
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update return status');
    }
  };

  const handleGenerateShippingLabel = async (returnId) => {
    try {
      const response = await fetch(`/api/returns/${returnId}/generate-shipping-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Shipping label generated and sent to customer');
        
        // Optionally download the label for admin records
        if (result.labelUrl) {
          const labelResponse = await fetch(result.labelUrl);
          const blob = await labelResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `return-label-${returnId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        throw new Error('Failed to generate shipping label');
      }
    } catch (error) {
      console.error('Shipping label generation error:', error);
      toast.error('Failed to generate shipping label');
    }
  };

  const handleDownloadShippingLabel = async (returnId) => {
    try {
      const response = await fetch(`/api/returns/${returnId}/shipping-label`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `return-label-${returnId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Shipping label downloaded successfully!');
      } else {
        throw new Error('Shipping label not found');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download shipping label');
    }
  };

  const handleQualityCheck = async () => {
    try {
      await addQualityCheck({
        id: selectedReturn._id,
        qualityNotes,
        qualityRating,
        qualityItems
      }).unwrap();
      toast.success('Quality check completed');
      setShowQualityModal(false);
      refetchReturns();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit quality check');
    }
  };

  const handleProcessRefund = async () => {
    try {
      await processRefund({
        id: selectedReturn._id,
        refundAmount,
        refundReason,
        refundMethod
      }).unwrap();
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      refetchReturns();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to process refund');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = returnStatuses.find(s => s.value === status) || returnStatuses[0];
    return (
      <Badge bg={statusConfig.color} className="px-2 py-1">
        {statusConfig.label}
      </Badge>
    );
  };

  const renderOverviewTab = () => (
    <Row>
      <Col lg={12}>
        <Row className="mb-4">
          {statsData && [
            {
              title: 'Total Returns',
              value: statsData.totalReturns || 0,
              icon: FaBox,
              color: 'primary',
              change: statsData.returnsChange || 0
            },
            {
              title: 'Pending Returns',
              value: statsData.pendingReturns || 0,
              icon: FaClock,
              color: 'warning',
              change: statsData.pendingChange || 0
            },
            {
              title: 'Refund Amount',
              value: `$${(statsData.totalRefunds || 0).toFixed(2)}`,
              icon: FaDollarSign,
              color: 'success',
              change: statsData.refundChange || 0
            },
            {
              title: 'Return Rate',
              value: `${(statsData.returnRate || 0).toFixed(1)}%`,
              icon: FaChartPie,
              color: 'info',
              change: statsData.rateChange || 0
            }
          ].map((stat, index) => (
            <Col lg={3} md={6} className="mb-3" key={index}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="d-flex align-items-center">
                  <div className={`bg-${stat.color} text-white rounded-3 p-3 me-3`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <h6 className="mb-0 text-muted">{stat.title}</h6>
                    <h4 className="mb-0">{stat.value}</h4>
                    <small className={`text-${stat.change >= 0 ? 'success' : 'danger'}`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}% vs last month
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Actions */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quick Actions</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaExclamationTriangle className="text-warning me-2" />
                      Returns Needing Attention
                    </div>
                    <Badge bg="warning">{statsData?.urgentReturns || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaClipboardList className="text-info me-2" />
                      Quality Checks Due
                    </div>
                    <Badge bg="info">{statsData?.qualityChecksDue || 0}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6}>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaDollarSign className="text-success me-2" />
                      Refunds to Process
                    </div>
                    <Badge bg="success">{statsData?.refundsPending || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaShippingFast className="text-primary me-2" />
                      Items to Receive
                    </div>
                    <Badge bg="primary">{statsData?.itemsInTransit || 0}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderReturnsListTab = () => (
    <Row>
      <Col>
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search returns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {returnStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button variant="outline-primary" onClick={refetchReturns}>
                  <FaFilter className="me-2" />
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Returns Table */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Returns List</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {returnsLoading ? (
              <Loader />
            ) : returnsError ? (
              <Message variant="danger">
                {returnsError?.data?.message || 'Error loading returns'}
              </Message>
            ) : (
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Return ID</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsData?.returns?.length > 0 ? (
                    returnsData.returns.map((returnItem) => (
                      <tr key={returnItem._id}>
                        <td>
                          <code className="text-primary">
                            #{returnItem._id.slice(-6)}
                          </code>
                        </td>
                        <td>
                          <Link to={`/admin/order/${returnItem.orderId}`} className="text-decoration-none">
                            #{returnItem.orderId?.slice(-6)}
                          </Link>
                        </td>
                        <td>
                          <div>
                            <div className="fw-bold">{returnItem.customerName}</div>
                            <small className="text-muted">{returnItem.customerEmail}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">
                            {returnItem.returnItems?.length || 0} items
                          </Badge>
                        </td>
                        <td>
                          <span className="text-capitalize">
                            {returnItem.returnReason?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <strong>${(returnItem.returnAmount || 0).toFixed(2)}</strong>
                        </td>
                        <td>{getStatusBadge(returnItem.status)}</td>
                        <td>
                          {returnItem.createdAt && !isNaN(new Date(returnItem.createdAt).getTime()) 
                            ? format(new Date(returnItem.createdAt), 'MMM dd, yyyy') 
                            : 'N/A'}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setShowReturnModal(true);
                              }}
                            >
                              <FaEye />
                            </Button>
                            {returnItem.status === 'received' && (
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
                                  setQualityItems(returnItem.returnItems || []);
                                  setShowQualityModal(true);
                                }}
                              >
                                <FaStar />
                              </Button>
                            )}
                            {(returnItem.status === 'approved' || returnItem.status === 'inspecting') && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
                                  setRefundAmount(returnItem.returnAmount || 0);
                                  setShowRefundModal(true);
                                }}
                                title="Process Refund"
                              >
                                <FaDollarSign />
                              </Button>
                            )}
                            {returnItem.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleStatusUpdate(returnItem._id, 'approved')}
                                  title="Approve Return"
                                  className="me-1"
                                >
                                  <FaCheck />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleStatusUpdate(returnItem._id, 'rejected')}
                                  title="Reject Return"
                                >
                                  <FaTimes />
                                </Button>
                              </>
                            )}
                            {returnItem.status === 'received' && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleStatusUpdate(returnItem._id, 'inspecting')}
                                title="Start Quality Check"
                              >
                                <FaSearch />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="text-muted">
                          <FaBox size={48} className="mb-3" />
                          <p>No returns found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
          {returnsData?.totalPages > 1 && (
            <Card.Footer>
              <Pagination>
                {[...Array(returnsData.totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </Card.Footer>
          )}
        </Card>
      </Col>
    </Row>
  );

  if (statsLoading) return <Loader />;
  if (statsError) return <Message variant="danger">{statsError?.data?.message || 'Error loading dashboard'}</Message>;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <FaUndo className="me-2" />
            Return Management
          </h2>
          <p className="text-muted mb-0">Manage customer returns and refunds</p>
        </div>
        <div>
          <LinkContainer to="/admin/dashboard">
            <Button variant="outline-secondary">
              <FaArrowLeft className="me-2" />
              Back to Dashboard
            </Button>
          </LinkContainer>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title={
          <span>
            <FaChartPie className="me-2" />
            Overview
          </span>
        }>
          {renderOverviewTab()}
        </Tab>
        <Tab eventKey="returns" title={
          <span>
            <FaBox className="me-2" />
            Returns List
          </span>
        }>
          {renderReturnsListTab()}
        </Tab>
      </Tabs>

      {/* Return Details Modal */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Return Details - #{selectedReturn?._id?.slice(-6)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReturn && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p><strong>Name:</strong> {selectedReturn.customerName}</p>
                  <p><strong>Email:</strong> {selectedReturn.customerEmail}</p>
                  <p><strong>Order ID:</strong> #{selectedReturn.orderId?.slice(-6)}</p>
                </Col>
                <Col md={6}>
                  <h6>Return Information</h6>
                  <p><strong>Status:</strong> {getStatusBadge(selectedReturn.status)}</p>
                  <p><strong>Reason:</strong> {selectedReturn.returnReason?.replace('_', ' ')}</p>
                  <p><strong>Amount:</strong> ${(selectedReturn.returnAmount || 0).toFixed(2)}</p>
                </Col>
              </Row>

              <h6>Return Items</h6>
              <Table size="sm" className="mb-3">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.returnItems?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.returnQty}</td>
                      <td>${(item.price || 0).toFixed(2)}</td>
                      <td className="text-capitalize">{item.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {selectedReturn.detailedReason && (
                <>
                  <h6>Detailed Reason</h6>
                  <p className="text-muted">{selectedReturn.detailedReason}</p>
                </>
              )}

              <div className="d-flex gap-2">
                {selectedReturn.status === 'pending' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedReturn._id, 'approved')}
                    >
                      <FaCheck className="me-1" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedReturn._id, 'rejected')}
                    >
                      <FaTimes className="me-1" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedReturn.status === 'approved' && (
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedReturn._id, 'received')}
                  >
                    <FaBoxOpen className="me-1" />
                    Mark as Received
                  </Button>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quality Check Modal */}
      <Modal show={showQualityModal} onHide={() => setShowQualityModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quality Check - #{selectedReturn?._id?.slice(-6)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Overall Quality Rating</Form.Label>
            <Form.Range
              min={1}
              max={5}
              value={qualityRating}
              onChange={(e) => setQualityRating(e.target.value)}
            />
            <div className="d-flex justify-content-between">
              <small>Poor</small>
              <small>Excellent</small>
            </div>
            <div className="text-center mt-2">
              <strong>Rating: {qualityRating}/5</strong>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quality Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              placeholder="Enter detailed quality assessment notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQualityModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleQualityCheck}>
            Complete Quality Check
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Refund Processing Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Process Refund - #{selectedReturn?._id?.slice(-6)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Refund Amount</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                step="0.01"
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Refund Method</Form.Label>
            <Form.Select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
            >
              <option value="original_payment">Original Payment Method</option>
              <option value="store_credit">Store Credit</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Refund Reason/Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund adjustment or notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleProcessRefund}>
            <FaDollarSign className="me-2" />
            Process Refund
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReturnManagementScreen; 