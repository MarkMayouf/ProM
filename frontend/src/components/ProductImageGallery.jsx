import React, { useState } from 'react';
import { Image, Row, Col, Button } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight, FaExpand, FaSearchPlus } from 'react-icons/fa';
import { getFullImageUrl } from '../utils/imageUtils';
import './ProductImageGallery.css';

const ProductImageGallery = ({ 
  mainImage, 
  images = [], 
  productName, 
  className = '',
  showThumbnails = true,
  maxThumbnails = 6,
  onImageClick = null
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Combine main image with additional images, ensuring we have unique images
  const allImages = [];
  
  // Add main image first if it exists
  if (mainImage) {
    allImages.push(mainImage);
  }
  
  // Add additional images, filtering out duplicates and empty values
  if (images && Array.isArray(images)) {
    images.forEach(image => {
      if (image && !allImages.includes(image)) {
        allImages.push(image);
      }
    });
  }
  
  // If no images, show placeholder
  if (allImages.length === 0) {
    return (
      <div className={`product-image-gallery ${className}`}>
        <div className="main-image-container">
        <Image
          src="/images/sample.jpg"
          alt={productName || "Product"}
          fluid
          className="main-image"
        />
      </div>
      </div>
    );
  }
  
  const currentImage = allImages[selectedImageIndex];
  
  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(currentImage, selectedImageIndex);
    } else {
      setIsZoomed(!isZoomed);
    }
  };

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
    setIsZoomed(false); // Reset zoom when changing images
  };
  
  return (
    <div className={`product-image-gallery charles-tyrwhitt-style ${className}`}>
      {/* Main Image Display */}
      <div className="main-image-container">
        <div className={`main-image-wrapper ${isZoomed ? 'zoomed' : ''}`}>
        <Image
          src={getFullImageUrl(currentImage)}
          alt={`${productName || "Product"} - Image ${selectedImageIndex + 1}`}
          fluid
          className="main-image"
            onClick={handleImageClick}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/sample.jpg';
            }}
          />
          
          {/* Zoom Button - Charles Tyrwhitt Style */}
          <button 
            className="zoom-button"
            onClick={handleZoomToggle}
            aria-label="Zoom image"
          >
            Zoom
          </button>
        </div>
        
        {/* Navigation Arrows (only show if more than 1 image) */}
        {allImages.length > 1 && (
          <>
            <button
              className="nav-arrow nav-arrow-left"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <FaChevronLeft />
            </button>
            <button
              className="nav-arrow nav-arrow-right"
              onClick={nextImage}
              aria-label="Next image"
            >
              <FaChevronRight />
            </button>
          </>
        )}
        
        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="image-counter">
            {selectedImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation - Charles Tyrwhitt Style */}
      {showThumbnails && allImages.length > 1 && (
        <div className="thumbnails-container">
          <div className="thumbnails-row">
            {allImages.slice(0, maxThumbnails).map((image, index) => (
                <div
                key={`thumbnail-${index}`}
                className={`thumbnail-item ${selectedImageIndex === index ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
                >
                  <Image
                    src={getFullImageUrl(image)}
                    alt={`${productName || "Product"} thumbnail ${index + 1}`}
                    fluid
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/sample.jpg';
                  }}
                  />
                </div>
            ))}
            {allImages.length > maxThumbnails && (
              <div className="thumbnail-item more-images">
                  <span>+{allImages.length - maxThumbnails}</span>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery; 