import React, { useState, useRef } from 'react';
import { Form, Button, Alert, Card, Image, Spinner, ProgressBar } from 'react-bootstrap';
import { FaUpload, FaImage, FaTrash, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SingleImageUploader = ({ 
  onImageUploaded, 
  currentImage = '', 
  label = 'Image',
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  showPreview = true,
  required = false
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentImage);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Supported formats: JPG, PNG, GIF, WebP');
    }
    
    return errors;
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };
  
  const validateAndSetFile = (file) => {
    const errors = validateFile(file);
    
    if (errors.length === 0) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      errors.forEach(error => toast.error(error));
    }
  };
  
  const removeFile = () => {
    setSelectedFile(null);
    setPreview(currentImage);
    setUploadProgress(0);
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
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };
  
  const uploadImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      const response = await fetch('/api/upload/content', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || ''}`,
        },
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      setUploadProgress(100);
      
      if (result.imageUrl) {
        toast.success('Image uploaded successfully');
        onImageUploaded(result.imageUrl);
        setPreview(result.imageUrl);
        setSelectedFile(null);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setUploadProgress(0);
    } finally {
      setUploading(false);
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
    <div className="single-image-uploader">
      <Form.Group className="mb-3">
        <Form.Label>
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
        
        {/* File Input */}
        <div
          className={`border rounded p-3 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'} ${uploading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          {uploading ? (
            <div>
              <Spinner animation="border" size="sm" className="mb-2" />
              <p className="mb-2">Uploading...</p>
              <ProgressBar now={uploadProgress} className="mb-2" />
              <small className="text-muted">{uploadProgress}%</small>
            </div>
          ) : (
            <div>
              <FaCloudUploadAlt size={24} className="text-muted mb-2" />
              <p className="mb-2">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop an image'}
              </p>
              <small className="text-muted">
                Supported formats: JPG, PNG, GIF, WebP (Max: {Math.round(maxFileSize / (1024 * 1024))}MB)
              </small>
            </div>
          )}
        </div>
        
        {/* Selected File Info */}
        {selectedFile && !uploading && (
          <div className="mt-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                <FaImage className="me-1" />
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={uploadImage}
                disabled={uploading}
              >
                <FaUpload className="me-1" />
                Upload
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                <FaTimes />
              </Button>
            </div>
          </div>
        )}
        
        {/* Image Preview */}
        {showPreview && preview && (
          <div className="mt-3">
            <small className="text-muted d-block mb-2">Preview:</small>
            <div className="position-relative d-inline-block">
              <Image
                src={preview}
                alt="Preview"
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '150px', 
                  objectFit: 'cover',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              />
              {preview !== currentImage && (
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-1"
                  onClick={() => setPreview(currentImage)}
                  style={{ transform: 'translate(50%, -50%)' }}
                >
                  <FaTimes size={10} />
                </Button>
              )}
            </div>
          </div>
        )}
      </Form.Group>
    </div>
  );
};

export default SingleImageUploader; 