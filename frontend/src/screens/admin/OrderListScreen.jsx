import React, { useState, useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Table,
  Button,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Badge,
  Dropdown,
  Alert,
} from 'react-bootstrap';
import {
  FaTimes,
  FaEdit,
  FaFileInvoice,
  FaTruck,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArchive,
  FaCaretDown,
  FaFileExport,
  FaShippingFast,
  FaRegClock,
  FaCheckDouble,

  FaRegCalendarAlt,
  FaPlus,
  FaTrash,
  FaUndo,
  FaClipboardList,
} from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import AdminSidebar from '../../components/AdminSidebar';
import { CSVLink } from 'react-csv';
import {
  useGetOrdersQuery,
  useBulkUpdateOrdersMutation,
  useDeleteOrderMutation,
} from '../../slices/ordersApiSlice';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const OrderListScreen = () => {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersPerPage] = useState(10);

  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery();

  const [bulkUpdateOrders, { isLoading: isUpdating }] =
    useBulkUpdateOrdersMutation();
  
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  // Filter and sort orders when data changes
  useEffect(() => {
    if (orders) {
      let result = [...orders];

      // Apply status filter
      if (statusFilter !== 'all') {
        switch (statusFilter) {
          case 'paid':
            result = result.filter(
              (order) => order.isPaid && !order.isDelivered && !order.refundProcessed
            );
            break;
          case 'unpaid':
            result = result.filter((order) => !order.isPaid && !order.refundProcessed);
            break;
          case 'delivered':
            result = result.filter((order) => order.isDelivered && !order.refundProcessed);
            break;
          case 'processing':
            result = result.filter(
              (order) => order.isPaid && !order.isDelivered && !order.refundProcessed
            );
            break;
          case 'refunded':
            result = result.filter((order) => order.refundProcessed);
            break;
          default:
            break;
        }
      }

      // Apply date range filter
      if (dateRange.startDate && dateRange.endDate) {
        result = result.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate >= dateRange.startDate && orderDate <= dateRange.endDate
          );
        });
      }

      // Apply search filter
      if (searchTerm.trim()) {
        result = result.filter(
          (order) =>
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user &&
              order.user.name &&
              order.user.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (order.user &&
              order.user.email &&
              order.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Apply sorting
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties like user.name
        if (sortConfig.key === 'user.name') {
          aValue = a.user ? a.user.name : '';
          bValue = b.user ? b.user.name : '';
        }

        // Convert dates to timestamps for comparison
        if (
          sortConfig.key === 'createdAt' ||
          sortConfig.key === 'paidAt' ||
          sortConfig.key === 'deliveredAt'
        ) {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      // Calculate total pages
      setTotalPages(Math.ceil(result.length / ordersPerPage));

      // Apply pagination
      const startIndex = (currentPage - 1) * ordersPerPage;
      const paginatedOrders = result.slice(
        startIndex,
        startIndex + ordersPerPage
      );

      setFilteredOrders(paginatedOrders);
    }
  }, [
    orders,
    searchTerm,
    statusFilter,
    dateRange,
    sortConfig,
    currentPage,
    ordersPerPage,
  ]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order._id));
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      await bulkUpdateOrders({
        orderIds: selectedOrders,
        action,
      }).unwrap();
      toast.success(`Orders ${action} successfully`);
      setSelectedOrders([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(orderId);
        toast.success('Order deleted successfully');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({
      startDate: null,
      endDate: null,
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate CSV export data
  const exportData = filteredOrders.map((order) => ({
    'Order ID': order._id,
    Customer: order.user ? order.user.name : 'N/A',
    Email: order.user ? order.user.email : 'N/A',
    'Order Date': formatDate(order.createdAt),
    'Total Amount': `$${order.totalPrice.toFixed(2)}`,
    'Payment Status': order.isPaid ? 'Paid' : 'Unpaid',
    'Delivery Status': order.isDelivered ? 'Delivered' : 'Pending',
    'Payment Date': order.isPaid ? formatDate(order.paidAt) : 'N/A',
    'Delivery Date': order.isDelivered ? formatDate(order.deliveredAt) : 'N/A',
  }));

  const getStatusBadge = (order) => {
    if (order.refundProcessed) {
      return (
        <Badge bg="warning" className="d-flex align-items-center">
          <FaUndo className="me-1" /> Refunded
        </Badge>
      );
    } else if (order.isDelivered) {
      return (
        <Badge bg="success" className="d-flex align-items-center">
          <FaCheckCircle className="me-1" /> Delivered
        </Badge>
      );
    } else if (order.isPaid) {
      return (
        <Badge bg="info" className="d-flex align-items-center">
          <FaRegClock className="me-1" /> Processing
        </Badge>
      );
    } else {
      return (
        <Badge bg="secondary" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-1" /> Pending
        </Badge>
      );
    }
  };

  return (
    <div className="modern-admin-container">
      <Row className="g-4">
        <Col lg={3} className="d-none d-lg-block">
          <AdminSidebar activeKey="orders" />
      </Col>
        <Col lg={9} xs={12}>
          {/* Modern Header */}
          <div className="modern-header-card">
            <div className="header-content">
              <div className="header-title-section">
                <h2 className="modern-title">
                  <FaClipboardList className="title-icon" />
                  Orders Management
                </h2>
                <p className="modern-subtitle">
                  Manage and track all customer orders
                </p>
              </div>
              <div className="header-actions">
              <LinkContainer to='/admin/order/create'>
                  <Button variant='light' size='sm' className='modern-btn me-2'>
                  <FaPlus className='me-1' />
                  Create Order
                </Button>
              </LinkContainer>
              <Button
                variant='light'
                size='sm'
                  className='modern-btn me-2'
                onClick={refetch}
                disabled={isLoading}
              >
                  <FaSyncAlt className={isLoading ? 'fa-spin me-1' : 'me-1'} />
                Refresh
              </Button>
              <CSVLink
                data={exportData}
                filename={'orders-export.csv'}
                  className='btn btn-light btn-sm modern-btn'
              >
                <FaFileExport className='me-1' /> Export
              </CSVLink>
            </div>
            </div>
          </div>

          {/* Modern Filters Card */}
          <div className="modern-filters-card">
            <h6 className="filter-title">
              <FaFilter className="me-2" />
              Filter Orders
            </h6>
            <Row className='g-3'>
              <Col lg={3} md={6} xs={12}>
                <div className="modern-input-group">
                  <FaSearch className="input-icon" />
                  <Form.Control
                    placeholder='Search orders...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="modern-input"
                  />
                </div>
              </Col>
              <Col lg={3} md={6} xs={12}>
                <div className="modern-select-group">
                  <FaFilter className="select-icon" />
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="modern-select"
                  >
                    <option value='all'>All Orders</option>
                    <option value='unpaid'>Unpaid</option>
                    <option value='paid'>Paid</option>
                    <option value='processing'>Processing</option>
                    <option value='delivered'>Delivered</option>
                    <option value='refunded'>Refunded</option>
                  </Form.Select>
                </div>
              </Col>
              <Col lg={4} md={8} xs={12}>
                <div className="modern-datepicker-group">
                  <FaRegCalendarAlt className="datepicker-icon" />
                  <DatePicker
                    selectsRange
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={(update) => {
                      setDateRange({
                        startDate: update[0],
                        endDate: update[1],
                      });
                    }}
                    className='form-control modern-datepicker'
                    placeholderText='Filter by date range'
                  />
                </div>
              </Col>
              <Col lg={2} md={4} xs={12}>
                <Button
                  variant='outline-secondary'
                  className='w-100 modern-reset-btn'
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </Col>
            </Row>
          </div>

          {/* Bulk Actions Alert */}
            {selectedOrders.length > 0 && (
            <div className="modern-bulk-actions">
              <div className="bulk-info">
                <FaCheckCircle className="bulk-icon" />
                <span className="bulk-text">
                  <strong>{selectedOrders.length}</strong> orders selected
                </span>
              </div>
              <div className="bulk-buttons">
                  <Button
                    variant='outline-primary'
                    size='sm'
                  className='me-2 modern-bulk-btn'
                    onClick={() => handleBulkAction('markDelivered')}
                    disabled={isUpdating}
                  >
                    <FaShippingFast className='me-1' /> Mark as Delivered
                  </Button>
                  <Button
                    variant='outline-danger'
                    size='sm'
                  className='modern-bulk-btn'
                    onClick={() => handleBulkAction('archive')}
                    disabled={isUpdating}
                  >
                    <FaArchive className='me-1' /> Archive
                  </Button>
                </div>
            </div>
            )}

          {/* Modern Content Card */}
          <div className="modern-content-card">
            {isLoading ? (
              <div className="modern-loader">
              <Loader />
              </div>
            ) : error ? (
              <div className="modern-error">
              <Message variant='danger'>
                {error?.data?.message || error.error}
              </Message>
              </div>
            ) : (
              <>
                <div className="modern-table-container">
                  <div className="table-responsive">
                    <Table className='modern-table'>
                      <thead className="modern-thead">
                    <tr>
                          <th className="checkbox-col">
                        <Form.Check
                          type='checkbox'
                          onChange={handleSelectAll}
                          checked={
                            selectedOrders.length === filteredOrders.length &&
                            filteredOrders.length > 0
                          }
                              className="modern-checkbox"
                        />
                      </th>
                      <th
                        onClick={() => handleSort('_id')}
                            className="sortable-col"
                      >
                            Order ID{' '}
                        {sortConfig.key === '_id' &&
                              (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleSort('user.name')}
                            className="sortable-col d-none d-md-table-cell"
                      >
                            Customer{' '}
                        {sortConfig.key === 'user.name' &&
                              (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleSort('createdAt')}
                            className="sortable-col d-none d-lg-table-cell"
                      >
                            Date{' '}
                        {sortConfig.key === 'createdAt' &&
                              (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleSort('totalPrice')}
                            className="sortable-col"
                      >
                            Total{' '}
                        {sortConfig.key === 'totalPrice' &&
                              (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                          <th className="d-none d-md-table-cell">Payment</th>
                          <th>Status</th>
                          <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                      <tbody className="modern-tbody">
                    {filteredOrders.map((order) => (
                          <tr key={order._id} className="modern-row">
                        <td>
                          <Form.Check
                            type='checkbox'
                            onChange={() => handleSelectOrder(order._id)}
                            checked={selectedOrders.includes(order._id)}
                                className="modern-checkbox"
                          />
                        </td>
                            <td className="order-id-col">
                              <span className="order-id">
                                #{order._id.substring(order._id.length - 8)}
                              </span>
                            </td>
                            <td className="d-none d-md-table-cell">
                              <div className="customer-info">
                                <span className="customer-name">
                                  {order.user ? order.user.name : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="d-none d-lg-table-cell">
                              <span className="order-date">
                                {formatDate(order.createdAt)}
                              </span>
                            </td>
                            <td>
                              <span className="order-total">
                                ${order.totalPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="d-none d-md-table-cell">
                          {order.isPaid ? (
                                <div className="payment-paid">
                                  <FaCheckCircle className="payment-icon" />
                                  <span className="payment-text">Paid</span>
                                </div>
                              ) : (
                                <div className="payment-unpaid">
                                  <FaTimes className="payment-icon" />
                                  <span className="payment-text">Unpaid</span>
                                </div>
                          )}
                        </td>
                        <td>{getStatusBadge(order)}</td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant='light'
                              size='sm'
                                  className='modern-dropdown-toggle'
                                  id={`dropdown-order-${order._id}`}
                            >
                                  <span className="d-none d-sm-inline">Actions</span>
                                  <span className="d-sm-none">⋯</span>
                                  <FaCaretDown className="d-none d-sm-inline ms-1" />
                            </Dropdown.Toggle>
                                <Dropdown.Menu className='modern-dropdown-menu'>
                              <LinkContainer to={`/order/${order._id}`}>
                                    <Dropdown.Item className="modern-dropdown-item">
                                  <FaEdit className='me-2' /> View Details
                                </Dropdown.Item>
                              </LinkContainer>
                              <LinkContainer
                                to={`/order/${order._id}`}
                                state={{ tab: 'invoice' }}
                              >
                                    <Dropdown.Item className="modern-dropdown-item">
                                  <FaFileInvoice className='me-2' /> Invoice
                                </Dropdown.Item>
                              </LinkContainer>
                              <LinkContainer
                                to={`/order/${order._id}`}
                                state={{ tab: 'tracking' }}
                              >
                                    <Dropdown.Item className="modern-dropdown-item">
                                  <FaTruck className='me-2' /> Shipping
                                </Dropdown.Item>
                              </LinkContainer>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                onClick={() => handleDeleteOrder(order._id)}
                                    className="modern-dropdown-item text-danger"
                                disabled={isDeleting}
                              >
                                <FaTrash className='me-2' /> Delete Order
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                            <td colSpan='8' className='modern-empty-state'>
                              <div className="empty-state-content">
                                <FaExclamationTriangle className='empty-icon' />
                                <p className="empty-text">No orders match your filter criteria</p>
                              </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                  </div>
                </div>

                {/* Modern Pagination */}
                {totalPages > 1 && (
                  <div className='modern-pagination-container'>
                    <nav className="modern-pagination">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="pagination-btn"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                        <span className="d-none d-sm-inline">Previous</span>
                        <span className="d-sm-none">‹</span>
                      </Button>
                      
                      <div className="pagination-numbers">
                      {[...Array(totalPages).keys()].map((page) => (
                          <Button
                          key={page + 1}
                            variant={currentPage === page + 1 ? 'primary' : 'outline-primary'}
                            size="sm"
                            className="pagination-number"
                            onClick={() => setCurrentPage(page + 1)}
                          >
                            {page + 1}
                          </Button>
                      ))}
                      </div>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="pagination-btn"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                        <span className="d-none d-sm-inline">Next</span>
                        <span className="d-sm-none">›</span>
                      </Button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
      </Col>
    </Row>
    </div>
  );
};

export default OrderListScreen;
