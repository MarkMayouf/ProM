import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  Tabs,
  Tab,
  Container,
  Alert,
  ListGroup,
  Image,
  Spinner,
  InputGroup,
  ProgressBar,
} from 'react-bootstrap';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaUpload,
  FaSave,
  FaTimes,
  FaSearch,
  FaCopy,
  FaHome,
  FaStore,
  FaImages,
  FaFlag,
  FaCheck,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import AdminSidebar from '../../components/AdminSidebar';
import Meta from '../../components/Meta';
import {
  useGetHomeContentAdminQuery,
  useAddHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useAddPerfectCombinationMutation,
  useUpdatePerfectCombinationMutation,
  useDeletePerfectCombinationMutation,
  useGetProductsForSelectionQuery,
} from '../../slices/homeContentApiSlice';

const HomeContentManagementScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  // API hooks
  const {
    data: homeContentData,
    isLoading: homeContentLoading,
    error: homeContentError,
    refetch: refetchHomeContent,
  } = useGetHomeContentAdminQuery();

  // Mutations
  const [addHeroSlide] = useAddHeroSlideMutation();
  const [updateHeroSlide] = useUpdateHeroSlideMutation();
  const [deleteHeroSlide] = useDeleteHeroSlideMutation();
  const [addPerfectCombination] = useAddPerfectCombinationMutation();
  const [updatePerfectCombination] = useUpdatePerfectCombinationMutation();
  const [deletePerfectCombination] = useDeletePerfectCombinationMutation();

  // Get products for selection
  const {
    data: productsData,
    isLoading: productsLoading,
  } = useGetProductsForSelectionQuery();

  // State
  const [activeTab, setActiveTab] = useState('hero');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Enhanced editing state for category images and combinations
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [imageEditForm, setImageEditForm] = useState({});
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [editingCombination, setEditingCombination] = useState(null);
  const [combinationForm, setCombinationForm] = useState({});
  
  // Image management state
  const [websiteImages, setWebsiteImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [imageFilter, setImageFilter] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image categories for filtering
  const imageCategories = [
    { value: 'all', label: 'All Images', icon: FaImages },
    { value: 'hero', label: 'Hero Content', icon: FaHome },
    { value: 'category-hero', label: 'Category Heroes', icon: FaStore },
  ];

  // Load website images
  const loadWebsiteImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch('/api/upload/website-images');
      if (response.ok) {
        const data = await response.json();
        // Handle the correct API response structure
        const images = data.images || data || [];
        setWebsiteImages(Array.isArray(images) ? images : []);
        console.log('✅ Successfully loaded', images.length, 'website images');
      } else {
        console.error('Failed to load images');
        setWebsiteImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setWebsiteImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    loadWebsiteImages();
  }, [loadWebsiteImages]);

  // Filter images based on search and category
  const filteredImages = React.useMemo(() => {
    if (isLoadingImages || !Array.isArray(websiteImages)) return [];
    return websiteImages.filter(image => {
      const matchesFilter = imageFilter === 'all' || image.category === imageFilter;
      const matchesSearch = image.name.toLowerCase().includes(imageSearchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [websiteImages, imageFilter, imageSearchTerm, isLoadingImages]);

  // Check if user is admin
  if (!userInfo || !userInfo.isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          Access Denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (homeContentLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Extract hero slides from home content data
  const heroSection = homeContentData?.find(section => section.sectionType === 'hero');
  const heroSlides = heroSection?.heroSlides || [];

  // Extract perfect combinations from home content data
  const perfectCombinationsSection = homeContentData?.find(section => section.sectionType === 'perfect-combinations');
  const perfectCombinations = perfectCombinationsSection?.perfectCombinations || [];

  // Modal handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'hero') {
      setFormData(item || {
        title: '',
        subtitle: '',
        description: '',
        image: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        isActive: true,
        order: heroSlides.length
      });
    } else if (type === 'combination') {
      setFormData(item || {
        name: '',
        description: '',
        suit: { productId: '', name: '', image: '', price: 0 },
        shoes: { productId: '', name: '', image: '', price: 0 },
        accessories: { productId: '', name: '', image: '', price: 0 },
        totalPrice: 0,
        discountedPrice: 0,
        savings: 0,
        rating: 4.5,
        numReviews: 0,
        isActive: true,
        order: perfectCombinations.length
      });
    }
    
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

  const handleImageUpload = (imageUrl, fieldName = 'image') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (modalType === 'hero') {
      if (!formData.image || formData.image.trim() === '') {
        toast.error('Please select an image for the hero slide');
        return;
      }
      if (!formData.title || formData.title.trim() === '') {
        toast.error('Please enter a title for the hero slide');
        return;
      }
    }
    
    // Clean up empty productId values for perfect combinations
    let dataToSubmit = { ...formData };
    if (modalType === 'combination') {
      if (dataToSubmit.suit && dataToSubmit.suit.productId === '') {
        dataToSubmit.suit.productId = null;
      }
      if (dataToSubmit.shoes && dataToSubmit.shoes.productId === '') {
        dataToSubmit.shoes.productId = null;
      }
      if (dataToSubmit.accessories && dataToSubmit.accessories.productId === '') {
        dataToSubmit.accessories.productId = null;
      }
    }
    
    try {
      if (modalType === 'hero') {
        if (editingItem) {
          await updateHeroSlide({ slideId: editingItem._id, ...dataToSubmit }).unwrap();
          toast.success('Hero slide updated successfully');
        } else {
          await addHeroSlide(dataToSubmit).unwrap();
          toast.success('Hero slide added successfully');
        }
      } else if (modalType === 'combination') {
        if (editingItem) {
          await updatePerfectCombination({ combinationId: editingItem._id, ...dataToSubmit }).unwrap();
          toast.success('Perfect combination updated successfully');
        } else {
          await addPerfectCombination(dataToSubmit).unwrap();
          toast.success('Perfect combination added successfully');
        }
      }
      
      closeModal();
      refetchHomeContent();
    } catch (error) {
      toast.error(error?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (type === 'hero') {
          await deleteHeroSlide(id).unwrap();
          toast.success('Hero slide deleted successfully');
        } else if (type === 'combination') {
          await deletePerfectCombination(id).unwrap();
          toast.success('Perfect combination deleted successfully');
        }
        
        refetchHomeContent();
      } catch (error) {
        toast.error(error?.data?.message || 'An error occurred');
      }
    }
  };

  const copyImagePath = (path) => {
    navigator.clipboard.writeText(path);
    toast.success('Image path copied to clipboard');
  };

  const handleNewImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      setUploadProgress(0);
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.successful} image(s)`);
        loadWebsiteImages();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadProgress(0);
      setSelectedFiles(null);
    }
  };

  const deleteImage = async (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await fetch(`/api/upload/image/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Image deleted successfully');
          loadWebsiteImages();
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        toast.error('Failed to delete image');
      }
    }
  };

  const handleImageUploadFiles = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles) {
      await handleNewImageUpload(selectedFiles);
    }
  };

  // Enhanced editing functions for category images
  const openImageEditModal = (image) => {
    setEditingImage(image);
    setImageEditForm({
      name: image.name || '',
      category: image.category || 'hero',
      alt: image.alt || '',
      description: image.description || '',
      tags: image.tags ? image.tags.join(', ') : '',
      isActive: image.isActive !== false,
      sortOrder: image.sortOrder || 0
    });
    setShowImageEditModal(true);
  };

  const closeImageEditModal = () => {
    setShowImageEditModal(false);
    setEditingImage(null);
    setImageEditForm({});
  };

  const handleImageEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...imageEditForm,
        tags: imageEditForm.tags ? imageEditForm.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await fetch(`/api/upload/website-images/${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Image updated successfully');
        closeImageEditModal();
        loadWebsiteImages(); // Reload images
      } else {
        toast.error('Failed to update image');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Error updating image');
    }
  };

  // Enhanced editing functions for perfect combinations
  const openCombinationEditModal = (combination = null) => {
    setEditingCombination(combination);
    setCombinationForm(combination || {
      name: '',
      description: '',
      suit: { productId: '', name: '', image: '', price: 0 },
      shoes: { productId: '', name: '', image: '', price: 0 },
      accessories: { productId: '', name: '', image: '', price: 0 },
      totalPrice: 0,
      discountedPrice: 0,
      savings: 0,
      rating: 4.5,
      numReviews: 0,
      isActive: true,
      order: perfectCombinations.length,
      tags: '',
      season: 'all-season',
      occasion: 'business'
    });
    setShowCombinationModal(true);
  };

  const closeCombinationEditModal = () => {
    setShowCombinationModal(false);
    setEditingCombination(null);
    setCombinationForm({});
  };

  const handleCombinationEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...combinationForm,
        totalPrice: (combinationForm.suit?.price || 0) + 
                   (combinationForm.shoes?.price || 0) + 
                   (combinationForm.accessories?.price || 0),
        tags: combinationForm.tags ? combinationForm.tags.split(',').map(tag => tag.trim()) : []
      };

      const url = editingCombination 
        ? `/api/home-content/perfect-combinations/${editingCombination._id}`
        : '/api/home-content/perfect-combinations';
      
      const method = editingCombination ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success(`Perfect combination ${editingCombination ? 'updated' : 'created'} successfully`);
        closeCombinationEditModal();
        refetchHomeContent(); // Reload home content
      } else {
        toast.error(`Failed to ${editingCombination ? 'update' : 'create'} perfect combination`);
      }
    } catch (error) {
      console.error('Error saving perfect combination:', error);
      toast.error('Error saving perfect combination');
    }
  };

  return (
    <>
      <Meta title="Hero & Content Manager - Admin" />
      <style jsx="true">{`
        .image-selector-card {
          transition: all 0.2s ease;
          border: 2px solid transparent;
          position: relative;
        }
        
        .image-selector-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-color: #007bff;
        }
        
        .image-selector-card.selected {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
        
        .image-selector-card.selected:hover {
          border-color: #28a745;
        }
      `}</style>
      <Row>
        <Col md={3} lg={2}>
          <AdminSidebar activeKey="home-content" />
        </Col>
        <Col md={9} lg={10}>
          <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-1">
                  <FaFlag className="me-2 text-primary" />
                  Hero & Content Manager
                </h1>
                <p className="text-muted mb-0">
                  Manage homepage hero slides and category hero images
                </p>
              </div>
              {activeTab === 'hero' && (
                <Button
                  variant="primary"
                  onClick={() => openModal('hero')}
                >
                  <FaPlus className="me-2" />
                  Add Hero Slide
                </Button>
              )}
              {activeTab === 'combinations' && (
                <Button
                  variant="primary"
                  onClick={() => openModal('combination')}
                >
                  <FaPlus className="me-2" />
                  Add Combination
                </Button>
              )}
            </div>

            {homeContentError && (
              <Alert variant="danger" className="mb-4">
                Error loading content: {homeContentError.data?.message || homeContentError.message}
              </Alert>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              {/* Hero Slides Tab */}
              <Tab eventKey="hero" title={
                <span>
                  <FaHome className="me-1" />
                  Hero Slides ({heroSlides.length})
                </span>
              }>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Homepage Hero Carousel</h5>
                  </Card.Header>
                  <Card.Body>
                    {heroSlides.length === 0 ? (
                      <Alert variant="info">
                        No hero slides found. Add your first hero slide to get started.
                      </Alert>
                    ) : (
                      <ListGroup variant="flush">
                        {heroSlides.map((slide, index) => (
                          <ListGroup.Item key={slide._id} className="d-flex align-items-center">
                            <div className="me-3">
                              <Image
                                src={slide.image}
                                alt={slide.title}
                                width={100}
                                height={60}
                                style={{ objectFit: 'cover' }}
                                rounded
                              />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{slide.title}</h6>
                              <p className="mb-1 text-muted small">{slide.subtitle}</p>
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg={slide.isActive ? 'success' : 'secondary'}>
                                  {slide.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge bg="info">Order: {slide.order}</Badge>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openModal('hero', slide)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete('hero', slide._id)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Tab>

              {/* Category Images Tab */}
              <Tab eventKey="category-images" title={
                <span>
                  <FaStore className="me-1" />
                  Category Images
                </span>
              }>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Category Hero Images</h5>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUploadFiles}
                        style={{ width: 'auto' }}
                      />
                      <Button
                        variant="success"
                        onClick={handleUploadSubmit}
                        disabled={!selectedFiles}
                      >
                        <FaUpload className="me-1" />
                        Upload
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search images..."
                            value={imageSearchTerm}
                            onChange={(e) => setImageSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Select
                          value={imageFilter}
                          onChange={(e) => setImageFilter(e.target.value)}
                        >
                          {imageCategories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Row>

                    {uploadProgress > 0 && (
                      <ProgressBar 
                        now={uploadProgress} 
                        label={`${uploadProgress}%`}
                        className="mb-3"
                      />
                    )}

                    {isLoadingImages ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading images...</p>
                      </div>
                    ) : filteredImages.length === 0 ? (
                      <Alert variant="info">
                        No images found. Upload some images to get started.
                      </Alert>
                    ) : (
                      <Row className="image-manager-grid">
                        {filteredImages.map((image, index) => (
                          <Col key={image.id} md={4} lg={3} className="mb-3">
                            <Card className="h-100 position-relative image-edit-card">
                              <div style={{ height: '150px', overflow: 'hidden' }}>
                                <Card.Img
                                  variant="top"
                                  src={image.url}
                                  alt={image.name}
                                  style={{ 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    width: '100%'
                                  }}
                                />
                              </div>
                              <div className="image-status-badge">
                                <Badge bg={image.isActive !== false ? 'success' : 'warning'} style={{ fontSize: '0.7rem' }}>
                                  {image.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <Card.Body className="p-2">
                                <Card.Title className="h6 mb-1" style={{ fontSize: '0.8rem' }}>
                                  {image.name}
                                </Card.Title>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                                    {image.category}
                                  </Badge>
                                </div>
                                {image.description && (
                                  <Card.Text className="small text-muted mb-2" style={{ fontSize: '0.7rem' }}>
                                    {image.description.length > 50 
                                      ? `${image.description.substring(0, 50)}...` 
                                      : image.description}
                                  </Card.Text>
                                )}
                                <div className="d-flex gap-1 flex-wrap image-actions">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openImageEditModal(image)}
                                    title="Edit image details"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => copyImagePath(image.url)}
                                    title="Copy path"
                                  >
                                    <FaCopy />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => deleteImage(image.id)}
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Tab>

              {/* Perfect Combinations Tab */}
              <Tab eventKey="combinations" title={
                <span>
                  <FaStore className="me-1" />
                  Perfect Combinations ({perfectCombinations.length})
                </span>
              }>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Perfect Combinations</h5>
                    <Button
                      variant="primary"
                      onClick={() => openCombinationEditModal()}
                    >
                      <FaPlus className="me-2" />
                      Add Combination
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {perfectCombinations.length === 0 ? (
                      <Alert variant="info">
                        No perfect combinations found. Add your first combination to get started.
                      </Alert>
                    ) : (
                      <ListGroup variant="flush">
                        {perfectCombinations.map((combination, index) => (
                          <ListGroup.Item key={combination._id} className="d-flex align-items-center combination-list-item">
                            <div className="me-3">
                              <div className="combination-product-images">
                                {combination.suit?.image && (
                                  <Image
                                    src={combination.suit.image}
                                    alt="Suit"
                                    className="combination-product-thumb"
                                  />
                                )}
                                {combination.shoes?.image && (
                                  <Image
                                    src={combination.shoes.image}
                                    alt="Shoes"
                                    className="combination-product-thumb"
                                  />
                                )}
                                {combination.accessories?.image && (
                                  <Image
                                    src={combination.accessories.image}
                                    alt="Accessories"
                                    className="combination-product-thumb"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{combination.name}</h6>
                              <p className="mb-1 text-muted small">{combination.description}</p>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <Badge bg={combination.isActive ? 'success' : 'secondary'}>
                                  {combination.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge bg="info">Order: {combination.order || 0}</Badge>
                                {combination.totalPrice && (
                                  <Badge bg="warning">
                                    ${combination.totalPrice.toFixed(2)}
                                  </Badge>
                                )}
                                {combination.season && (
                                  <Badge bg="secondary">{combination.season}</Badge>
                                )}
                                {combination.occasion && (
                                  <Badge bg="dark">{combination.occasion}</Badge>
                                )}
                              </div>
                              {combination.tags && combination.tags.length > 0 && (
                                <div className="combination-tags">
                                  {combination.tags.map((tag, idx) => (
                                    <span key={idx} className="combination-tag">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openCombinationEditModal(combination)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete('combination', combination._id)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>

            {/* Hero Slide Modal */}
            <Modal show={showModal && modalType === 'hero'} onHide={closeModal} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>
                  {editingItem ? 'Edit Hero Slide' : 'Add Hero Slide'}
                </Modal.Title>
              </Modal.Header>
              <Form onSubmit={handleSubmit}>
                <Modal.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title <span className="text-danger">*</span></Form.Label>
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
                    <Form.Label>Hero Image <span className="text-danger">*</span></Form.Label>
                    
                    {/* Image Selection from Uploaded Images */}
                    <div className="mb-3">
                      <Form.Label className="small text-muted">Select from uploaded images:</Form.Label>
                      {isLoadingImages ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" />
                          <small className="d-block mt-1">Loading images...</small>
                        </div>
                      ) : filteredImages.length === 0 ? (
                        <Alert variant="info" className="py-2">
                          <small>No images available. Upload some images first.</small>
                        </Alert>
                      ) : (
                        <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <Row>
                            {filteredImages.map((image) => (
                              <Col key={image.id} xs={6} md={4} lg={3} className="mb-2">
                                <Card 
                                  className={`image-selector-card ${formData.image === image.url ? 'selected' : ''}`}
                                  onClick={() => handleImageUpload(image.url, 'image')}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div style={{ height: '80px', overflow: 'hidden' }}>
                                    <Card.Img
                                      variant="top"
                                      src={image.url}
                                      alt={image.name}
                                      style={{ 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        width: '100%'
                                      }}
                                    />
                                  </div>
                                  <Card.Body className="p-1">
                                    <small className="text-truncate d-block" title={image.name}>
                                      {image.name}
                                    </small>
                                  </Card.Body>
                                  {formData.image === image.url && (
                                    <div className="position-absolute top-0 end-0 m-1">
                                      <Badge bg="success">
                                        <FaCheck />
                                      </Badge>
                                    </div>
                                  )}
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                    </div>

                    {/* Selected Image Preview */}
                    {formData.image && (
                      <div className="mb-3">
                        <Form.Label className="small text-muted">Selected image:</Form.Label>
                        <div className="border rounded p-2 d-flex align-items-center">
                          <img
                            src={formData.image}
                            alt="Selected"
                            style={{ 
                              width: '60px', 
                              height: '60px', 
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                          <div className="ms-2 flex-grow-1">
                            <small className="text-muted">
                              {formData.image.split('/').pop()}
                            </small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleImageUpload('', 'image')}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Form.Text className="text-muted">
                      Select an image from the uploaded images above. Upload new images in the "Image Management" tab if needed.
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Button Text</Form.Label>
                        <Form.Control
                          type="text"
                          name="buttonText"
                          value={formData.buttonText || 'Shop Now'}
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
                          value={formData.buttonLink || '/products'}
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
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    <FaSave className="me-2" />
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>

            {/* Perfect Combination Modal */}
            <Modal show={showModal && modalType === 'combination'} onHide={closeModal} size="xl">
              <Modal.Header closeButton>
                <Modal.Title>
                  {editingItem ? 'Edit Perfect Combination' : 'Add Perfect Combination'}
                </Modal.Title>
              </Modal.Header>
              <Form onSubmit={handleSubmit}>
                <Modal.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Combination Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., Executive Power Look"
                          required
                        />
                      </Form.Group>
                    </Col>
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
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Describe this perfect combination..."
                    />
                  </Form.Group>

                  {/* Product Selection */}
                  <Row>
                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Suit</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Suit Product</Form.Label>
                            <Form.Select
                              value={formData.suit?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.suits?.find(p => p._id === e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  suit: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select a suit...</option>
                              {productsData?.suits?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {formData.suit?.image && (
                            <div className="text-center">
                              <img
                                src={formData.suit.image}
                                alt={formData.suit.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{formData.suit.name}</div>
                              <div className="small text-muted">${formData.suit.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Shoes</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Shoes Product</Form.Label>
                            <Form.Select
                              value={formData.shoes?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.shoes?.find(p => p._id === e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  shoes: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select shoes...</option>
                              {productsData?.shoes?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {formData.shoes?.image && (
                            <div className="text-center">
                              <img
                                src={formData.shoes.image}
                                alt={formData.shoes.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{formData.shoes.name}</div>
                              <div className="small text-muted">${formData.shoes.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Accessories</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Accessories Product</Form.Label>
                            <Form.Select
                              value={formData.accessories?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.accessories?.find(p => p._id === e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  accessories: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select accessories...</option>
                              {productsData?.accessories?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {formData.accessories?.image && (
                            <div className="text-center">
                              <img
                                src={formData.accessories.image}
                                alt={formData.accessories.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{formData.accessories.name}</div>
                              <div className="small text-muted">${formData.accessories.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Pricing */}
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Price</Form.Label>
                        <Form.Control
                          type="number"
                          name="totalPrice"
                          value={formData.totalPrice || 0}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discounted Price</Form.Label>
                        <Form.Control
                          type="number"
                          name="discountedPrice"
                          value={formData.discountedPrice || 0}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Savings</Form.Label>
                        <Form.Control
                          type="number"
                          name="savings"
                          value={formData.savings || 0}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          type="number"
                          name="rating"
                          value={formData.rating || 4.5}
                          onChange={handleInputChange}
                          min="0"
                          max="5"
                          step="0.1"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number of Reviews</Form.Label>
                        <Form.Control
                          type="number"
                          name="numReviews"
                          value={formData.numReviews || 0}
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
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    <FaSave className="me-2" />
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>

            {/* Enhanced Image Edit Modal */}
            <Modal show={showImageEditModal} onHide={closeImageEditModal} size="lg" className="enhanced-modal">
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaEdit className="me-2" />
                  Edit Image Details
                </Modal.Title>
              </Modal.Header>
              <Form onSubmit={handleImageEditSubmit}>
                <Modal.Body>
                  {editingImage && (
                    <Row className="mb-3">
                      <Col md={4}>
                        <img
                          src={editingImage.url}
                          alt={editingImage.name}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                          className="rounded"
                        />
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>Image Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={imageEditForm.name || ''}
                            onChange={(e) => setImageEditForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Category</Form.Label>
                          <Form.Select
                            value={imageEditForm.category || 'hero'}
                            onChange={(e) => setImageEditForm(prev => ({ ...prev, category: e.target.value }))}
                          >
                            <option value="hero">Hero Content</option>
                            <option value="category-hero">Category Heroes</option>
                            <option value="banner">Banners</option>
                            <option value="collection">Collections</option>
                            <option value="brand">Brands</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Alt Text</Form.Label>
                        <Form.Control
                          type="text"
                          value={imageEditForm.alt || ''}
                          onChange={(e) => setImageEditForm(prev => ({ ...prev, alt: e.target.value }))}
                          placeholder="Alternative text for accessibility"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sort Order</Form.Label>
                        <Form.Control
                          type="number"
                          value={imageEditForm.sortOrder || 0}
                          onChange={(e) => setImageEditForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={imageEditForm.description || ''}
                      onChange={(e) => setImageEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the image"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control
                      type="text"
                      value={imageEditForm.tags || ''}
                      onChange={(e) => setImageEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Comma-separated tags (e.g., summer, formal, collection)"
                    />
                    <Form.Text className="text-muted">
                      Use tags to help organize and search for images
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active (visible in image manager)"
                      checked={imageEditForm.isActive !== false}
                      onChange={(e) => setImageEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeImageEditModal}>
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    <FaSave className="me-2" />
                    Save Changes
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>

            {/* Enhanced Perfect Combination Edit Modal */}
            <Modal show={showCombinationModal} onHide={closeCombinationEditModal} size="xl" className="enhanced-modal">
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaStore className="me-2" />
                  {editingCombination ? 'Edit Perfect Combination' : 'Create Perfect Combination'}
                </Modal.Title>
              </Modal.Header>
              <Form onSubmit={handleCombinationEditSubmit}>
                <Modal.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Combination Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          value={combinationForm.name || ''}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Executive Power Look"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Season</Form.Label>
                        <Form.Select
                          value={combinationForm.season || 'all-season'}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, season: e.target.value }))}
                        >
                          <option value="all-season">All Season</option>
                          <option value="spring">Spring</option>
                          <option value="summer">Summer</option>
                          <option value="fall">Fall</option>
                          <option value="winter">Winter</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occasion</Form.Label>
                        <Form.Select
                          value={combinationForm.occasion || 'business'}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, occasion: e.target.value }))}
                        >
                          <option value="business">Business</option>
                          <option value="formal">Formal</option>
                          <option value="wedding">Wedding</option>
                          <option value="casual">Casual</option>
                          <option value="special-event">Special Event</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={combinationForm.description || ''}
                      onChange={(e) => setCombinationForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this perfect combination..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control
                      type="text"
                      value={combinationForm.tags || ''}
                      onChange={(e) => setCombinationForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Comma-separated tags (e.g., classic, modern, luxury)"
                    />
                    <Form.Text className="text-muted">
                      Tags help users find combinations that match their style
                    </Form.Text>
                  </Form.Group>

                  {/* Product Selection */}
                  <Row>
                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Suit</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Suit Product</Form.Label>
                            <Form.Select
                              value={combinationForm.suit?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.suits?.find(p => p._id === e.target.value);
                                setCombinationForm(prev => ({
                                  ...prev,
                                  suit: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select a suit...</option>
                              {productsData?.suits?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {combinationForm.suit?.image && (
                            <div className="text-center">
                              <img
                                src={combinationForm.suit.image}
                                alt={combinationForm.suit.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{combinationForm.suit.name}</div>
                              <div className="small text-muted">${combinationForm.suit.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Shoes</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Shoes Product</Form.Label>
                            <Form.Select
                              value={combinationForm.shoes?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.shoes?.find(p => p._id === e.target.value);
                                setCombinationForm(prev => ({
                                  ...prev,
                                  shoes: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select shoes...</option>
                              {productsData?.shoes?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {combinationForm.shoes?.image && (
                            <div className="text-center">
                              <img
                                src={combinationForm.shoes.image}
                                alt={combinationForm.shoes.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{combinationForm.shoes.name}</div>
                              <div className="small text-muted">${combinationForm.shoes.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="mb-3 product-selection-card">
                        <Card.Header>
                          <h6 className="mb-0">Accessories</h6>
                        </Card.Header>
                        <Card.Body className="combination-product-preview">
                          <Form.Group className="mb-2">
                            <Form.Label>Select Accessories Product</Form.Label>
                            <Form.Select
                              value={combinationForm.accessories?.productId || ''}
                              onChange={(e) => {
                                const selectedProduct = productsData?.accessories?.find(p => p._id === e.target.value);
                                setCombinationForm(prev => ({
                                  ...prev,
                                  accessories: selectedProduct ? {
                                    productId: selectedProduct._id,
                                    name: selectedProduct.name,
                                    image: selectedProduct.image,
                                    price: selectedProduct.price
                                  } : { productId: '', name: '', image: '', price: 0 }
                                }));
                              }}
                            >
                              <option value="">Select accessories...</option>
                              {productsData?.accessories?.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          {combinationForm.accessories?.image && (
                            <div className="text-center">
                              <img
                                src={combinationForm.accessories.image}
                                alt={combinationForm.accessories.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <div className="small mt-1">{combinationForm.accessories.name}</div>
                              <div className="small text-muted">${combinationForm.accessories.price}</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Pricing and Settings */}
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discounted Price</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={combinationForm.discountedPrice || ''}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, discountedPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="Special bundle price"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={combinationForm.rating || 4.5}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.5 }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number of Reviews</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={combinationForm.numReviews || 0}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, numReviews: parseInt(e.target.value) || 0 }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Display Order</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={combinationForm.order || 0}
                          onChange={(e) => setCombinationForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Group className="mb-0">
                      <Form.Check
                        type="checkbox"
                        label="Active (visible on website)"
                        checked={combinationForm.isActive !== false}
                        onChange={(e) => setCombinationForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                    </Form.Group>
                    
                    {combinationForm.suit?.price || combinationForm.shoes?.price || combinationForm.accessories?.price ? (
                      <div className="text-end pricing-summary">
                        <div className="h5 mb-0 total-price">
                          Total: ${((combinationForm.suit?.price || 0) + (combinationForm.shoes?.price || 0) + (combinationForm.accessories?.price || 0)).toFixed(2)}
                        </div>
                        {combinationForm.discountedPrice && (
                          <div className="discounted-price">
                            Bundle Price: ${combinationForm.discountedPrice.toFixed(2)}
                            <br />
                            <small className="savings">Save: ${((combinationForm.suit?.price || 0) + (combinationForm.shoes?.price || 0) + (combinationForm.accessories?.price || 0) - combinationForm.discountedPrice).toFixed(2)}</small>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeCombinationEditModal}>
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    <FaSave className="me-2" />
                    {editingCombination ? 'Update Combination' : 'Create Combination'}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>
          </Container>
        </Col>
      </Row>
    </>
  );
};

export default HomeContentManagementScreen; 