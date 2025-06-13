import React, { useState } from 'react';
import { Form, Button, Alert, ProgressBar, Card, Row, Col, Badge } from 'react-bootstrap';
import { FaUpload, FaImage, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const ImageUploader = ({ onUploadComplete, maxFiles = 5, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'] }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  
  // Max file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };
  
  const validateAndAddFiles = (selectedFiles) => {
    const newErrors = { ...uploadErrors };
    let hasErrors = false;
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const fileId = `${file.name}-${file.size}`;
      
      // Check if we already have this file
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        newErrors[fileId] = 'File already added';
        hasErrors = true;
        return false;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        newErrors[fileId] = 'File exceeds the 5MB limit';
        hasErrors = true;
        return false;
      }
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        newErrors[fileId] = 'File type not supported';
        hasErrors = true;
        return false;
      }
      
      // Passed all checks
      return true;
    });
    
    // Check max files limit
    if (files.length + validFiles.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }
    
    // Add valid files and update errors
    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
    
    if (hasErrors) {
      setUploadErrors(newErrors);
      // Clear errors after 5 seconds
      setTimeout(() => {
        setUploadErrors({});
      }, 5000);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const getFileTypeIcon = (fileType) => {
    return <FaImage />;
  };
  
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    const uploadedUrls = [];
    const newProgress = {};
    const newErrors = {};
    
    // Initialize progress for all files
    files.forEach(file => {
      const fileId = `${file.name}-${file.size}`;
      newProgress[fileId] = 0;
    });
    
    setUploadProgress(newProgress);
    
    try {
      // Upload each file
      for (const file of files) {
        const fileId = `${file.name}-${file.size}`;
        
        try {
          const formData = new FormData();
          formData.append('image', file);
          
          const { data } = await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(prev => ({
                ...prev,
                [fileId]: percentCompleted,
              }));
            },
          });
          
          uploadedUrls.push(data);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          newErrors[fileId] = error.response?.data?.message || 'Upload failed';
        }
      }
      
      // Call the completion callback with all successful uploads
      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls);
      }
      
      // Update errors if any
      if (Object.keys(newErrors).length > 0) {
        setUploadErrors(newErrors);
      } else {
        // Clear files if all uploads were successful
        setFiles([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadErrors({ general: 'An error occurred during upload' });
    } finally {
      setUploading(false);
    }
  };
  
  const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="image-uploader">
      {/* Drop Zone */}
      <div 
        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <FaUpload size={32} className="upload-icon" />
          <h5>Drag & Drop Files Here</h5>
          <p>Or click to browse files</p>
          <small className="text-muted">
            Supported formats: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, TIFF (Max 5MB)
          </small>
          
          <Form.Control
            type="file"
            className="file-input"
            onChange={handleFileChange}
            accept={allowedTypes.join(',')}
            multiple
            disabled={uploading}
          />
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="file-list mt-4">
          <h6 className="mb-3">Selected Files ({files.length}/{maxFiles})</h6>
          <Row xs={1} md={2} className="g-3">
            {files.map((file, index) => {
              const fileId = `${file.name}-${file.size}`;
              const hasError = uploadErrors[fileId];
              const progress = uploadProgress[fileId] || 0;
              
              return (
                <Col key={index}>
                  <Card className={`file-item ${hasError ? 'has-error' : ''}`}>
                    <Card.Body className="d-flex align-items-center">
                      <div className="file-icon me-3">
                        {getFileTypeIcon(file.type)}
                      </div>
                      <div className="file-info flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <div className="file-name text-truncate">{file.name}</div>
                          <Badge bg="secondary">{getFileExtension(file.name).toUpperCase()}</Badge>
                        </div>
                        <div className="file-meta text-muted small">{formatFileSize(file.size)}</div>
                        
                        {uploading && (
                          <ProgressBar 
                            now={progress} 
                            label={`${progress}%`} 
                            variant={hasError ? 'danger' : 'primary'} 
                            className="mt-2"
                          />
                        )}
                        
                        {hasError && (
                          <Alert variant="danger" className="mt-2 p-1 small">
                            <FaExclamationTriangle className="me-1" /> {hasError}
                          </Alert>
                        )}
                      </div>
                      
                      {!uploading && (
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="ms-2" 
                          onClick={() => removeFile(index)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
      
      {/* Upload Button */}
      <div className="upload-actions mt-4">
        {uploadErrors.general && (
          <Alert variant="danger" className="mb-3">
            {uploadErrors.general}
          </Alert>
        )}
        
        <Button 
          variant="primary" 
          disabled={files.length === 0 || uploading} 
          onClick={uploadFiles}
        >
          {uploading ? (
            <>Uploading Files...</>
          ) : (
            <>
              <FaUpload className="me-2" /> Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
            </>
          )}
        </Button>
      </div>
      
      <style jsx="true">{`
        .image-uploader {
          margin-bottom: 2rem;
        }
        
        .upload-dropzone {
          border: 2px dashed #ced4da;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          background-color: #f8f9fa;
        }
        
        .upload-dropzone:hover, .upload-dropzone.active {
          border-color: #6c757d;
          background-color: #e9ecef;
        }
        
        .upload-icon {
          color: #6c757d;
          margin-bottom: 1rem;
        }
        
        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .file-item {
          transition: all 0.2s ease;
        }
        
        .file-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .file-item.has-error {
          border-color: #dc3545;
        }
        
        .file-icon {
          font-size: 1.5rem;
          color: #6c757d;
        }
        
        .file-name {
          font-weight: 500;
          max-width: 180px;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader; 