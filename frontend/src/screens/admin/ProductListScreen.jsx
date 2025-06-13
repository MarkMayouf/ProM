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
  Image,
} from 'react-bootstrap';
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaFilter,
  FaEye,
  FaCaretDown,
  FaFileExport,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import AdminSidebar from '../../components/AdminSidebar';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from '../../slices/productsApiSlice';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import '../../assets/styles/admin.css';
import '../../assets/styles/admin-dropdown.css';

const ProductListScreen = () => {
  const { pageNumber } = useParams();
  const navigate = useNavigate();

  // Scroll to top when component mounts or page changes
  useScrollToTop({ onMount: true });

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { data, isLoading, error, refetch } = useGetProductsQuery({
    pageNumber,
    limit: 1000, // Fetch all products for admin view
  });

  const [deleteProduct, { isLoading: loadingDelete }] =
    useDeleteProductMutation();

  // Filter products based on search and filters
  useEffect(() => {
    if (data?.products) {
      let filtered = [...data.products];

      // Apply search filter
      if (searchTerm.trim()) {
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(
          (product) => product.category.toLowerCase() === categoryFilter.toLowerCase()
        );
      }

      // Apply stock filter
      if (stockFilter === 'low') {
        filtered = filtered.filter((product) => product.countInStock <= 10);
      } else if (stockFilter === 'out') {
        filtered = filtered.filter((product) => product.countInStock === 0);
      }

      setFilteredProducts(filtered);
    }
  }, [data, searchTerm, categoryFilter, stockFilter]);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProduct(id);
        refetch();
        toast.success('Product deleted successfully');
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const createProductHandler = () => {
    navigate('/admin/product/create');
  };

  // Get unique categories for filter dropdown
  const categories = data?.products
    ? [...new Set(data.products.map((product) => product.category))]
    : [];

  // Prepare data for CSV export
  const exportData = data?.products
    ? data.products.map((product) => ({
        ID: product._id,
        Name: product.name,
        Price: `$${product.price}`,
        Category: product.category,
        Brand: product.brand,
        Stock: product.countInStock,
        'On Sale': product.isOnSale ? 'Yes' : 'No',
        'Sale Price': product.salePrice ? `$${product.salePrice}` : 'N/A',
      }))
    : [];

  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (stock <= 10) {
      return <Badge bg="warning">Low Stock</Badge>;
    } else {
      return <Badge bg="success">In Stock</Badge>;
    }
  };

  // Format price display
  const formatPrice = (product) => {
    if (product.isOnSale && product.salePrice) {
      return (
        <>
          <span className="text-decoration-line-through text-muted me-2">
            ${product.price}
          </span>
          <span className="text-danger fw-bold">${product.salePrice}</span>
          <Badge bg="danger" className="ms-2">SALE</Badge>
        </>
      );
    }
    return <span>${product.price}</span>;
  };

  return (
    <Row>
      <Col md={3} lg={2}>
        <AdminSidebar activeKey="products" />
      </Col>
      <Col md={9} lg={10}>
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Products Management</h5>
            <div>
              <Button
                variant="primary"
                size="sm"
                className="me-2 create-product-btn"
                onClick={createProductHandler}
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                }}
              >
                <FaPlus className="me-1" />
                Create Product
              </Button>
              <Button
                variant="light"
                size="sm"
                className="me-2"
                onClick={refetch}
                disabled={isLoading}
              >
                <FaSyncAlt className={isLoading ? 'fa-spin me-1' : 'me-1'} />
                Refresh
              </Button>
              <CSVLink
                data={exportData}
                filename={'products-export.csv'}
                className="btn btn-light btn-sm"
              >
                <FaFileExport className="me-1" /> Export
              </CSVLink>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Filters */}
            <Row className="mb-3 gx-3">
              <Col md={6} lg={4} className="mb-3 mb-lg-0">
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={6} lg={3} className="mb-3 mb-lg-0">
                <InputGroup>
                  <InputGroup.Text>
                    <FaFilter />
                  </InputGroup.Text>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={6} lg={3} className="mb-3 mb-lg-0">
                <Form.Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock (≤10)</option>
                  <option value="out">Out of Stock</option>
                </Form.Select>
              </Col>
              <Col md={6} lg={2}>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStockFilter('all');
                  }}
                >
                  Reset
                </Button>
              </Col>
            </Row>

            {loadingDelete && <Loader />}
            {isLoading ? (
              <Loader />
            ) : error ? (
              <Message variant="danger">{error?.data?.message || error.error}</Message>
            ) : (
              <>
                <Table
                  striped
                  hover
                  responsive
                  className="table-sm admin-table"
                >
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={50}
                              height={50}
                              className="img-thumbnail"
                            />
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">{product.name}</div>
                              <small className="text-muted">
                                {product.brand} • ID: {product._id.substring(product._id.length - 8)}
                              </small>
                            </div>
                          </td>
                          <td>{formatPrice(product)}</td>
                          <td>
                            <Badge bg="secondary">{product.category}</Badge>
                            {product.subCategory && (
                              <div>
                                <small className="text-muted">{product.subCategory}</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{product.countInStock} units</div>
                            {getStockBadge(product.countInStock)}
                          </td>
                          <td>
                            {product.isOnSale ? (
                              <Badge bg="danger">On Sale</Badge>
                            ) : (
                              <Badge bg="success">Active</Badge>
                            )}
                          </td>
                          <td>
                            <Dropdown className="admin-actions-dropdown">
                              <Dropdown.Toggle
                                variant="light"
                                size="sm"
                                className="border admin-dropdown-toggle"
                              >
                                Actions <FaCaretDown />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="admin-dropdown-menu">
                                <LinkContainer to={`/product/${product._id}`}>
                                  <Dropdown.Item>
                                    <FaEye className="me-2" /> View Product
                                  </Dropdown.Item>
                                </LinkContainer>
                                <LinkContainer to={`/admin/products/${product._id}/edit`}>
                                  <Dropdown.Item>
                                    <FaEdit className="me-2" /> Edit Product
                                  </Dropdown.Item>
                                </LinkContainer>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  onClick={() => deleteHandler(product._id)}
                                  className="text-danger"
                                  disabled={loadingDelete}
                                >
                                  <FaTrash className="me-2" /> Delete Product
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-3">
                          <FaExclamationTriangle className="me-2 text-warning" />
                          No products match your filter criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                {data?.pages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Paginate pages={data.pages} page={data.page} isAdmin={true} />
                  </div>
                )}

                {/* Summary Stats */}
                <Row className="mt-4">
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <h5 className="text-primary">{data?.products?.length || 0}</h5>
                        <small className="text-muted">Total Products</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <h5 className="text-warning">
                          {data?.products?.filter(p => p.countInStock <= 10).length || 0}
                        </h5>
                        <small className="text-muted">Low Stock</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <h5 className="text-danger">
                          {data?.products?.filter(p => p.countInStock === 0).length || 0}
                        </h5>
                        <small className="text-muted">Out of Stock</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <h5 className="text-success">
                          {data?.products?.filter(p => p.isOnSale).length || 0}
                        </h5>
                        <small className="text-muted">On Sale</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ProductListScreen;
