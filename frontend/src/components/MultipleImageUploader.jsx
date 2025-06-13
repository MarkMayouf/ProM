import React, { useState, useRef } from 'react';
import { Form, Button, Alert, Card, Row, Col, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import { FaUpload, FaImage, FaTrash, FaCheck, FaExclamationTriangle, FaPlus, FaTimes, FaCloudUploadAlt, FaImages, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useUploadMultipleProductImagesMutation } from '../slices/productsApiSlice';

const MultipleImageUploader = ({ 
  onImagesUploaded, 
  existingImages = [], 
  maxFiles = 10, 
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
  onDeleteImage = null, // Function to handle image deletion
  allowDelete = false // Whether to show delete buttons for existing images
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [batchUploadProgress, setBatchUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const [uploadMultipleImages, { isLoading: uploading }] = useUploadMultipleProductImagesMutation();
  
  // Max file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Supported formats: JPG, PNG, GIF, WebP, SVG, BMP, TIFF');
    }
    
    return errors;
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
  };
  
  const validateAndAddFiles = (files) => {
    const totalFiles = selectedFiles.length + existingImages.length + files.length;
    
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed. You can add ${maxFiles - selectedFiles.length - existingImages.length} more.`);
      return;
    }
    
    const validFiles = [];
    const newPreviews = [];
    const errors = {};
    let processedCount = 0;
    
    files.forEach((file, index) => {
      const fileErrors = validateFile(file);
      
      if (fileErrors.length === 0) {
        validFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            id: `${file.name}-${Date.now()}-${index}`,
            file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          });
          
          processedCount++;
          if (processedCount === validFiles.length) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            setPreviews(prev => [...prev, ...newPreviews]);
            toast.success(`${validFiles.length} images ready for upload`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        errors[file.name] = fileErrors;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      Object.entries(errors).forEach(([fileName, fileErrors]) => {
        toast.error(`${fileName}: ${fileErrors.join(', ')}`);
      });
    }
  };
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[selectedFiles[index]?.name];
      return newErrors;
    });
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadErrors({});
    setBatchUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      validateAndAddFiles(files);
    }
  };
  
  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image to upload');
      return;
    }
    
    try {
      setBatchUploadProgress(0);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      console.log(`Uploading ${selectedFiles.length} files...`);
      
      const result = await uploadMultipleImages(formData).unwrap();
      
      console.log('Upload result:', result);
      
      if (result && result.imageUrls && result.imageUrls.length > 0) {
        setBatchUploadProgress(100);
        toast.success(`${result.imageUrls.length} images uploaded successfully`);
        onImagesUploaded(result.imageUrls);
        
        // Clear the form
        setSelectedFiles([]);
        setPreviews([]);
        setUploadErrors({});
        setUploadProgress({});
        setBatchUploadProgress(0);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.error('Upload result missing imageUrls:', result);
        setBatchUploadProgress(0);
        
        // Check if there are specific error details
        if (result && result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(err => `${err.originalName}: ${err.error}`).join(', ');
          toast.error(`Upload failed: ${errorMessages}`);
        } else {
          toast.error('No images were uploaded. Please check file formats and try again.');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setBatchUploadProgress(0);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload images';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="multiple-image-uploader">
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaImages className="me-2 text-primary" />
            <h6 className="mb-0">Product Images</h6>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Badge bg="secondary">
              {existingImages.length + selectedFiles.length} / {maxFiles}
            </Badge>
            {selectedFiles.length > 0 && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={removeAllFiles}
                className="d-flex align-items-center"
              >
                <FaTimes className="me-1" />
                Clear All
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {/* Drag and Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-content">
              <FaCloudUploadAlt className="upload-icon" size={48} />
              <p className="upload-text">
                {uploading ? 'Uploading images...' : 'Drag & drop multiple images here or click to browse'}
              </p>
              <small className="text-muted">
                Supported formats: JPG, PNG, GIF, WebP (Max 5MB each, up to {maxFiles} images)
              </small>
            </div>
            
            <Form.Control
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Uploading {selectedFiles.length} images...</span>
                <span className="text-muted">{Math.round(batchUploadProgress)}%</span>
              </div>
              <ProgressBar 
                now={batchUploadProgress} 
                variant="primary" 
                animated 
                className="mb-2"
              />
            </div>
          )}
          
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Selected Images ({selectedFiles.length})</h6>
                <small className="text-muted">
                  Total size: {formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}
                </small>
              </div>
              <Row>
                {previews.map((preview, index) => (
                  <Col key={preview.id} xs={6} md={4} lg={3} className="mb-3">
                    <Card className="image-preview-card h-100">
                      <div className="image-preview-container">
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="preview-image"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="remove-preview-btn"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                      <Card.Body className="p-2">
                        <small className="text-muted d-block text-truncate" title={preview.name}>
                          {preview.name}
                        </small>
                        <small className="text-muted">
                          {formatFileSize(preview.size)}
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
          
          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted">
                {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} ready to upload
              </span>
              <Button
                variant="primary"
                onClick={uploadImages}
                disabled={uploading || selectedFiles.length === 0}
                className="d-flex align-items-center"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-2" />
                    Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mt-4">
              <h6 className="d-flex align-items-center">
                <FaCheck className="text-success me-2" />
                Uploaded Images ({existingImages.length})
              </h6>
              <Row>
                {existingImages.map((imageUrl, index) => (
                  <Col key={index} xs={6} md={4} lg={3} className="mb-3">
                    <Card className="image-preview-card">
                      <div className="image-preview-container">
                        <img
                          src={imageUrl}
                          alt={`Product image ${index + 1}`}
                          className="preview-image"
                        />
                        <Badge bg="success" className="existing-badge">
                          <FaCheck />
                        </Badge>
                        {allowDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="remove-existing-btn"
                            onClick={() => onDeleteImage(imageUrl)}
                            disabled={uploading}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Upload Tips */}
          <Alert variant="info" className="mt-3 mb-0">
            <div className="d-flex align-items-start">
              <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
              <div>
                <strong>Upload Tips:</strong>
                <ul className="mb-0 mt-1">
                  <li>Select multiple images at once for faster bulk upload</li>
                  <li>Drag and drop multiple files directly into the upload area</li>
                  <li>Images will be automatically optimized and processed</li>
                  <li>First image uploaded will be used as the main product image</li>
                </ul>
              </div>
            </div>
          </Alert>
        </Card.Body>
      </Card>
      
      <style jsx>{`
        .drop-zone {
          border: 3px dashed #dee2e6;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f8f9fa;
          position: relative;
          overflow: hidden;
        }

        .drop-zone:hover:not(.uploading) {
          border-color: #007bff;
          background: #e3f2fd;
          transform: translateY(-2px);
        }

        .drop-zone.drag-active {
          border-color: #28a745;
          background: #d4edda;
          transform: scale(1.02);
        }

        .drop-zone.uploading {
          border-color: #6c757d;
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .drop-zone-content {
          position: relative;
          z-index: 1;
        }

        .upload-icon {
          color: #007bff;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .drop-zone:hover .upload-icon {
          transform: scale(1.1);
          color: #0056b3;
        }

        .upload-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .image-preview-card {
          transition: all 0.3s ease;
          border: 1px solid #dee2e6;
        }

        .image-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .image-preview-container {
          position: relative;
          height: 120px;
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .image-preview-card:hover .preview-image {
          transform: scale(1.05);
        }

        .remove-preview-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .image-preview-card:hover .remove-preview-btn {
          opacity: 1;
        }

        .existing-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-container {
          background: rgba(255,255,255,0.9);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .remove-existing-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .image-preview-card:hover .remove-existing-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default MultipleImageUploader; 