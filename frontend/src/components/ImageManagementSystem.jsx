import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Alert,
  Spinner,
  ProgressBar,
  ButtonGroup,
} from 'react-bootstrap';
import {
  FaUpload,
  FaSearch,
  FaFilter,
  FaEye,
  FaDownload,
  FaCopy,
  FaTrash,
  FaEdit,
  FaFolder,
  FaImage,
  FaTh,
  FaList,
  FaSort,
  FaCheck,
  FaTimes,
  FaPlus,
  FaCloudUploadAlt,
  FaImages,
  FaTag,
  FaCalendarAlt,
  FaFileImage,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const ImageManagementSystem = ({ onImageSelect, showSelectMode = false }) => {
  // State management
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'size'
  const [selectedImages, setSelectedImages] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Image categories
  const categories = [
    { value: 'all', label: 'All Images', icon: FaImages, color: '#6c757d' },
    { value: 'hero', label: 'Hero & Banner', icon: FaImage, color: '#007bff' },
    { value: 'category', label: 'Category Images', icon: FaFolder, color: '#28a745' },
    { value: 'product', label: 'Product Images', icon: FaTag, color: '#ffc107' },
    { value: 'background', label: 'Backgrounds', icon: FaFileImage, color: '#6f42c1' },
    { value: 'logo', label: 'Logos & Branding', icon: FaImage, color: '#dc3545' },
    { value: 'general', label: 'General', icon: FaImages, color: '#17a2b8' },
    { value: 'upload', label: 'Custom Uploads', icon: FaCloudUploadAlt, color: '#fd7e14' },
  ];

  // Load images from server
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('/api/upload/website-images', {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Error loading images');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort images
  useEffect(() => {
    let filtered = [...images];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort images
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploadDate) - new Date(a.uploadDate);
        case 'oldest':
          return new Date(a.uploadDate) - new Date(b.uploadDate);
        case 'name':
          return (a.name || a.originalName || '').localeCompare(b.name || b.originalName || '');
        case 'size':
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

    setFilteredImages(filtered);
  }, [images, selectedCategory, searchTerm, sortBy]);

  // Load images on component mount
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    formData.append('category', selectedCategory === 'all' ? 'general' : selectedCategory);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.successful} images`);
        
        // Add uploaded images to the current list for immediate feedback
        if (result.images && result.images.length > 0) {
          setImages(prevImages => [...result.images, ...prevImages]);
        }
        
        loadImages(); // Reload all images
        setShowUploadModal(false);
        setUploadFiles([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`/api/upload/image/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Image deleted successfully');
        loadImages(); // Reload images
        setShowDeleteModal(false);
        setImageToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const deletePromises = selectedImages.map(imageId =>
        fetch(`/api/upload/image/${imageId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userInfo?.token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(deletePromises);
      toast.success(`Deleted ${selectedImages.length} images`);
      setSelectedImages([]);
      loadImages();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete images');
    }
  };

  // Copy image URL to clipboard
  const copyImageUrl = (imageUrl) => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      toast.success('Image URL copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy URL');
    });
  };

  // Download image
  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Get category info
  const getCategoryInfo = (categoryValue) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render image card
  const renderImageCard = (image, index) => {
    const categoryInfo = getCategoryInfo(image.category);
    const isSelected = selectedImages.includes(image._id);

    return (
      <Col key={image._id || index} xs={6} sm={4} md={3} lg={2} className="mb-3">
        <Card 
          className={`image-card h-100 ${isSelected ? 'border-primary' : ''}`}
          style={{ cursor: showSelectMode ? 'pointer' : 'default' }}
          onClick={() => showSelectMode && onImageSelect && onImageSelect(image)}
        >
          <div className="position-relative">
            {/* Selection checkbox */}
            {!showSelectMode && (
              <Form.Check
                type="checkbox"
                className="position-absolute"
                style={{ top: '5px', left: '5px', zIndex: 2 }}
                checked={isSelected}
                onChange={() => toggleImageSelection(image._id)}
              />
            )}

            {/* Category badge */}
            <Badge
              className="position-absolute"
              style={{ 
                top: '5px', 
                right: '5px', 
                backgroundColor: categoryInfo.color,
                zIndex: 2 
              }}
            >
              <categoryInfo.icon className="me-1" />
              {categoryInfo.label}
            </Badge>

            {/* Image */}
            <div className="image-wrapper" style={{ height: '150px', overflow: 'hidden' }}>
              <img
                src={image.url}
                alt={image.name || image.originalName}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
              />
            </div>

            {/* Hover overlay */}
            <div className="image-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
              <ButtonGroup size="sm">
                <OverlayTrigger overlay={<Tooltip>Preview</Tooltip>}>
                  <Button
                    variant="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(image);
                      setShowPreviewModal(true);
                    }}
                  >
                    <FaEye />
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger overlay={<Tooltip>Copy URL</Tooltip>}>
                  <Button
                    variant="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyImageUrl(image.url);
                    }}
                  >
                    <FaCopy />
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger overlay={<Tooltip>Download</Tooltip>}>
                  <Button
                    variant="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image.url, image.name || image.originalName);
                    }}
                  >
                    <FaDownload />
                  </Button>
                </OverlayTrigger>

                {!showSelectMode && (
                  <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                    <Button
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageToDelete(image);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </OverlayTrigger>
                )}
              </ButtonGroup>
            </div>
          </div>

          <Card.Body className="p-2">
            <div className="d-flex flex-column">
              <small className="text-truncate fw-bold">
                {image.name || image.originalName || 'Unnamed'}
              </small>
              <small className="text-muted">
                {formatFileSize(image.size || 0)}
              </small>
              {image.uploadDate && (
                <small className="text-muted">
                  {new Date(image.uploadDate).toLocaleDateString()}
                </small>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container fluid className="image-management-system">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaImages className="me-2 text-primary" />
                Image Management System
              </h2>
              <p className="text-muted mb-0">
                Manage all website images with advanced organization and search
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
              className="d-flex align-items-center"
            >
              <FaUpload className="me-2" />
              Upload Images
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-light">
            <Card.Body className="py-3">
              <Row className="text-center">
                {categories.slice(1).map(category => {
                  const count = images.filter(img => img.category === category.value).length;
                  return (
                    <Col key={category.value} xs={6} md={3} lg={2} className="mb-2">
                      <div className="d-flex flex-column align-items-center">
                        <category.icon 
                          size={24} 
                          style={{ color: category.color }} 
                          className="mb-1"
                        />
                        <div className="fw-bold">{count}</div>
                        <small className="text-muted">{category.label}</small>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Controls */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        
        <Col md={3}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col md={2}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size (Large to Small)</option>
          </Form.Select>
        </Col>

        <Col md={3} className="d-flex gap-2">
          <ButtonGroup>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('grid')}
            >
              <FaTh />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </Button>
          </ButtonGroup>

          {selectedImages.length > 0 && (
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              className="d-flex align-items-center"
            >
              <FaTrash className="me-1" />
              Delete ({selectedImages.length})
            </Button>
          )}
        </Col>
      </Row>

      {/* Images Grid */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading images...</div>
        </div>
      ) : filteredImages.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <FaExclamationTriangle size={48} className="mb-3 text-muted" />
          <h5>No images found</h5>
          <p>Try adjusting your search criteria or upload some images to get started.</p>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <FaUpload className="me-2" />
            Upload Images
          </Button>
        </Alert>
      ) : (
        <Row>
          {filteredImages.map((image, index) => renderImageCard(image, index))}
        </Row>
      )}

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUpload className="me-2" />
            Upload Images
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={selectedCategory === 'all' ? 'general' : selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.slice(1).map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
              />
              <Form.Text className="text-muted">
                Select multiple images to upload. Supported formats: JPG, PNG, GIF, WebP
              </Form.Text>
            </Form.Group>

            {uploadFiles.length > 0 && (
              <div className="mb-3">
                <h6>Selected Files:</h6>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                    <span>{file.name}</span>
                    <small className="text-muted">{formatFileSize(file.size)}</small>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar now={uploadProgress} />
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleFileUpload(uploadFiles)}
            disabled={uploadFiles.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewImage && (
            <div>
              <img
                src={previewImage.url}
                alt={previewImage.name || previewImage.originalName}
                className="img-fluid mb-3"
                style={{ maxHeight: '500px' }}
              />
              <div className="text-start">
                <p><strong>Name:</strong> {previewImage.name || previewImage.originalName}</p>
                <p><strong>Category:</strong> {getCategoryInfo(previewImage.category).label}</p>
                <p><strong>Size:</strong> {formatFileSize(previewImage.size || 0)}</p>
                {previewImage.uploadDate && (
                  <p><strong>Upload Date:</strong> {new Date(previewImage.uploadDate).toLocaleString()}</p>
                )}
                <p><strong>URL:</strong> <code>{previewImage.url}</code></p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => copyImageUrl(previewImage?.url)}
          >
            <FaCopy className="me-1" />
            Copy URL
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FaExclamationTriangle className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this image?</p>
          {imageToDelete && (
            <div className="text-center">
              <img
                src={imageToDelete.url}
                alt={imageToDelete.name || imageToDelete.originalName}
                className="img-thumbnail mb-2"
                style={{ maxWidth: '200px' }}
              />
              <p><strong>{imageToDelete.name || imageToDelete.originalName}</strong></p>
            </div>
          )}
          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteImage(imageToDelete?._id)}
          >
            <FaTrash className="me-1" />
            Delete Image
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .image-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }

        .image-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .image-wrapper {
          position: relative;
          background: #f8f9fa;
        }

        .image-overlay {
          top: 0;
          left: 0;
          background: rgba(0,0,0,0.7);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-card:hover .image-overlay {
          opacity: 1;
        }

        .image-management-system .btn-group .btn {
          border-radius: 6px;
        }

        .image-management-system .btn-group .btn:not(:last-child) {
          margin-right: 4px;
        }
      `}</style>
    </Container>
  );
};

export default ImageManagementSystem; 