import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  Tabs,
  Tab,
  Alert,
  Spinner,
  InputGroup,
  ButtonGroup,
} from 'react-bootstrap';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaEye,
  FaSave,
  FaTimes,
  FaImages,
  FaCog,
  FaHome,
  FaShoppingBag,
  FaTshirt,
  FaGem,
  FaChartLine,
  FaUsers,
  FaBoxOpen,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import AdminSidebar from '../../components/AdminSidebar';
import Meta from '../../components/Meta';
import ImageManagementSystem from '../../components/ImageManagementSystem';
import SingleImageUploader from '../../components/SingleImageUploader';
import {
  useGetHomeContentAdminQuery,
  useGetProductsForSelectionQuery,
  useAddHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useAddCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddFeaturedSuitMutation,
  useUpdateFeaturedSuitMutation,
  useDeleteFeaturedSuitMutation,
} from '../../slices/homeContentApiSlice';

const EnhancedHomeContentManagementScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  // API hooks
  const {
    data: homeContentData,
    isLoading: homeContentLoading,
    error: homeContentError,
    refetch: refetchHomeContent,
  } = useGetHomeContentAdminQuery();

  const {
    data: products,
    isLoading: productsLoading,
  } = useGetProductsForSelectionQuery();

  // Mutations
  const [addHeroSlide] = useAddHeroSlideMutation();
  const [updateHeroSlide] = useUpdateHeroSlideMutation();
  const [deleteHeroSlide] = useDeleteHeroSlideMutation();
  const [addCollection] = useAddCollectionMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();
  const [addFeaturedSuit] = useAddFeaturedSuitMutation();
  const [updateFeaturedSuit] = useUpdateFeaturedSuitMutation();
  const [deleteFeaturedSuit] = useDeleteFeaturedSuitMutation();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentImageField, setCurrentImageField] = useState('');

  // Sample data for featured items
  const [featuredShoes, setFeaturedShoes] = useState([
    {
      _id: 'sample-shoe-1',
      name: 'Premium Oxford Leather Shoes',
      description: 'Handcrafted Italian leather oxfords for the discerning gentleman.',
      image: '/uploads/1748288303287-6eec34cb9ddb4447eecbb6a5120c6285.jpg',
      price: 299,
      regularPrice: 399,
      rating: 4.8,
      numReviews: 45,
      countInStock: 15,
      category: 'Shoes',
      brand: 'ProMayouf',
      isActive: true,
      order: 0
    },
    {
      _id: 'sample-shoe-2',
      name: 'Classic Derby Dress Shoes',
      description: 'Timeless derby style perfect for business and formal occasions.',
      image: '/uploads/1748288303287-6eec34cb9ddb4447eecbb6a5120c6285.jpg',
      price: 249,
      regularPrice: 329,
      rating: 4.6,
      numReviews: 32,
      countInStock: 20,
      category: 'Shoes',
      brand: 'ProMayouf',
      isActive: true,
      order: 1
    }
  ]);
  
  const [featuredAccessories, setFeaturedAccessories] = useState([
    {
      _id: 'sample-acc-1',
      name: 'Silk Luxury Tie Collection',
      description: 'Premium silk ties in classic patterns and colors.',
      image: '/uploads/1748288303286-f7e004c3b58e5788764d6882219ad592.jpg',
      price: 89,
      regularPrice: 119,
      rating: 4.7,
      numReviews: 38,
      countInStock: 25,
      category: 'Accessories',
      brand: 'ProMayouf',
      isActive: true,
      order: 0
    },
    {
      _id: 'sample-acc-2',
      name: 'Leather Belt Set',
      description: 'Genuine leather belts in black and brown.',
      image: '/uploads/1748288303286-f7e004c3b58e5788764d6882219ad592.jpg',
      price: 129,
      regularPrice: 169,
      rating: 4.5,
      numReviews: 24,
      countInStock: 18,
      category: 'Accessories',
      brand: 'ProMayouf',
      isActive: true,
      order: 1
    }
  ]);

  // Get statistics
  const getStatistics = () => {
    const heroSlides = homeContentData?.heroSlides || [];
    const collections = homeContentData?.collections || [];
    const featuredSuits = homeContentData?.featuredSuits || [];
    
    return {
      heroSlides: heroSlides.length,
      collections: collections.length,
      featuredSuits: featuredSuits.length,
      featuredShoes: featuredShoes.length,
      featuredAccessories: featuredAccessories.length,
      totalProducts: (products?.products || []).length,
    };
  };

  const stats = getStatistics();

  // Modal handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {
      title: '',
      subtitle: '',
      description: '',
      image: '',
      buttonText: '',
      buttonLink: '',
      isActive: true,
      order: 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (image) => {
    setFormData(prev => ({
      ...prev,
      [currentImageField]: image.url
    }));
    setShowImageSelector(false);
    setCurrentImageField('');
  };

  const openImageSelector = (fieldName) => {
    setCurrentImageField(fieldName);
    setShowImageSelector(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      switch (modalType) {
        case 'hero':
          if (editingItem) {
            result = await updateHeroSlide({ id: editingItem._id, ...formData });
          } else {
            result = await addHeroSlide(formData);
          }
          break;
          
        case 'collection':
          if (editingItem) {
            result = await updateCollection({ id: editingItem._id, ...formData });
          } else {
            result = await addCollection(formData);
          }
          break;
          
        case 'featured-suit':
          if (editingItem) {
            result = await updateFeaturedSuit({ id: editingItem._id, ...formData });
          } else {
            result = await addFeaturedSuit(formData);
          }
          break;
          
        default:
          throw new Error('Unknown modal type');
      }

      if (result.error) {
        throw new Error(result.error.data?.message || 'Operation failed');
      }

      toast.success(`${editingItem ? 'Updated' : 'Added'} successfully`);
      closeModal();
      refetchHomeContent();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      let result;
      
      switch (type) {
        case 'hero':
          result = await deleteHeroSlide(id);
          break;
        case 'collection':
          result = await deleteCollection(id);
          break;
        case 'featured-suit':
          result = await deleteFeaturedSuit(id);
          break;
        default:
          throw new Error('Unknown delete type');
      }

      if (result.error) {
        throw new Error(result.error.data?.message || 'Delete failed');
      }

      toast.success('Deleted successfully');
      refetchHomeContent();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Delete failed');
    }
  };

  // Render overview dashboard
  const renderOverview = () => (
    <div>
      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaImage size={32} className="text-primary mb-2" />
              <h3 className="mb-1">{stats.heroSlides}</h3>
              <p className="text-muted mb-0">Hero Slides</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaShoppingBag size={32} className="text-success mb-2" />
              <h3 className="mb-1">{stats.collections}</h3>
              <p className="text-muted mb-0">Collections</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaTshirt size={32} className="text-info mb-2" />
              <h3 className="mb-1">{stats.featuredSuits}</h3>
              <p className="text-muted mb-0">Featured Suits</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaGem size={32} className="text-warning mb-2" />
              <h3 className="mb-1">{stats.featuredShoes}</h3>
              <p className="text-muted mb-0">Featured Shoes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaBoxOpen size={32} className="text-danger mb-2" />
              <h3 className="mb-1">{stats.featuredAccessories}</h3>
              <p className="text-muted mb-0">Featured Accessories</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaUsers size={32} className="text-secondary mb-2" />
              <h3 className="mb-1">{stats.totalProducts}</h3>
              <p className="text-muted mb-0">Total Products</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <FaCog className="me-2" />
            Quick Actions
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={() => openModal('hero')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaPlus className="me-2" />
                  Add Hero Slide
                </Button>
                <Button
                  variant="success"
                  onClick={() => openModal('collection')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaPlus className="me-2" />
                  Add Collection
                </Button>
                <Button
                  variant="info"
                  onClick={() => openModal('featured-suit')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaPlus className="me-2" />
                  Add Featured Suit
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => setActiveTab('images')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaImages className="me-2" />
                  Manage Images
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => refetchHomeContent()}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaChartLine className="me-2" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline-info"
                  href="/"
                  target="_blank"
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaEye className="me-2" />
                  Preview Website
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );

  // Render content list
  const renderContentList = (items, type, title, addButtonText) => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{title}</h5>
        <Button
          variant="primary"
          size="sm"
          onClick={() => openModal(type)}
        >
          <FaPlus className="me-1" />
          {addButtonText}
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        {items && items.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>
                      <img
                        src={item.image || '/images/placeholder.jpg'}
                        alt={item.title || item.name}
                        style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{item.title || item.name}</div>
                        {item.subtitle && (
                          <small className="text-muted">{item.subtitle}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg={item.isActive ? 'success' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>{item.order || 0}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => openModal(type, item)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDelete(type, item._id)}
                        >
                          <FaTrash />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaImage size={48} className="text-muted mb-3" />
            <h6>No {title.toLowerCase()} found</h6>
            <p className="text-muted">Get started by adding your first item.</p>
            <Button
              variant="primary"
              onClick={() => openModal(type)}
            >
              <FaPlus className="me-1" />
              {addButtonText}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  if (homeContentLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <Meta title="Home Content Management - Admin" />
      <Container fluid>
        <Row>
          <Col md={2} className="p-0">
            <AdminSidebar />
          </Col>
          <Col md={10}>
            <div className="p-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h1 className="h3 mb-1">
                    <FaHome className="me-2 text-primary" />
                    Home Content Management
                  </h1>
                  <p className="text-muted mb-0">
                    Manage your website's home page content and images
                  </p>
                </div>
              </div>

              {homeContentError && (
                <Alert variant="danger" className="mb-4">
                  Error loading content: {homeContentError.data?.message || homeContentError.message}
                </Alert>
              )}

              {/* Tabs */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="overview" title={
                  <span>
                    <FaChartLine className="me-1" />
                    Overview
                  </span>
                }>
                  {renderOverview()}
                </Tab>

                <Tab eventKey="hero" title={
                  <span>
                    <FaImage className="me-1" />
                    Hero Slides
                  </span>
                }>
                  {renderContentList(
                    homeContentData?.heroSlides,
                    'hero',
                    'Hero Slides',
                    'Add Hero Slide'
                  )}
                </Tab>

                <Tab eventKey="collections" title={
                  <span>
                    <FaShoppingBag className="me-1" />
                    Collections
                  </span>
                }>
                  {renderContentList(
                    homeContentData?.collections,
                    'collection',
                    'Collections',
                    'Add Collection'
                  )}
                </Tab>

                <Tab eventKey="featured-suits" title={
                  <span>
                    <FaTshirt className="me-1" />
                    Featured Suits
                  </span>
                }>
                  {renderContentList(
                    homeContentData?.featuredSuits,
                    'featured-suit',
                    'Featured Suits',
                    'Add Featured Suit'
                  )}
                </Tab>

                <Tab eventKey="featured-shoes" title={
                  <span>
                    <FaGem className="me-1" />
                    Featured Shoes
                  </span>
                }>
                  {renderContentList(
                    featuredShoes,
                    'featured-shoe',
                    'Featured Shoes',
                    'Add Featured Shoe'
                  )}
                </Tab>

                <Tab eventKey="featured-accessories" title={
                  <span>
                    <FaBoxOpen className="me-1" />
                    Featured Accessories
                  </span>
                }>
                  {renderContentList(
                    featuredAccessories,
                    'featured-accessory',
                    'Featured Accessories',
                    'Add Featured Accessory'
                  )}
                </Tab>

                <Tab eventKey="images" title={
                  <span>
                    <FaImages className="me-1" />
                    Image Manager
                  </span>
                }>
                  <ImageManagementSystem />
                </Tab>
              </Tabs>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Content Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit' : 'Add'} {modalType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subtitle</Form.Label>
                  <Form.Control
                    type="text"
                    name="subtitle"
                    value={formData.subtitle || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  name="image"
                  value={formData.image || ''}
                  onChange={handleInputChange}
                  placeholder="Image URL"
                />
                <Button
                  variant="outline-primary"
                  onClick={() => openImageSelector('image')}
                >
                  <FaImages />
                </Button>
              </div>
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    style={{ maxWidth: '200px', maxHeight: '120px', objectFit: 'cover' }}
                    className="rounded border"
                  />
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Button Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="buttonText"
                    value={formData.buttonText || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Button Link</Form.Label>
                  <Form.Control
                    type="text"
                    name="buttonLink"
                    value={formData.buttonLink || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order || 0}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive || false}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              <FaTimes className="me-1" />
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FaSave className="me-1" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Image Selector Modal */}
      <Modal show={showImageSelector} onHide={() => setShowImageSelector(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaImages className="me-2" />
            Select Image
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <ImageManagementSystem
            onImageSelect={handleImageSelect}
            showSelectMode={true}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EnhancedHomeContentManagementScreen; 