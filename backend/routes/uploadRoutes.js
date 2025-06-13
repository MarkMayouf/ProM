import path from 'path';
import express from 'express';
import multer from 'multer';
import uploadController from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/firebaseAuth.js';
import fs from 'fs';

const router = express.Router();

// Get all website images for image manager (public access for viewing)
router.get('/website-images', uploadController.getWebsiteImages);

// Bulk upload all public images
router.post('/bulk-upload-public', protect, admin, uploadController.bulkUploadPublicImages);

// Update image metadata
router.put('/image/:imageId', protect, admin, uploadController.updateImageMetadata);

// Delete image
router.delete('/image/:imageId', protect, admin, uploadController.deleteImage);

// Upload content images (hero slides, categories)
router.post('/content', protect, admin, uploadController.uploadImageFile);

// Upload single product image
router.post('/', uploadController.uploadImageFile);

// Upload multiple product images
router.post('/multiple', uploadController.uploadMultipleImages);

// Update website image metadata
router.put('/website-images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, alt, description, tags, isActive, sortOrder } = req.body;
    
    // Find the image file and update metadata
    const imagesDir = path.join(process.cwd(), 'frontend', 'public', 'images');
    const uploadsDir = path.join(process.cwd(), 'frontend', 'public', 'uploads');
    
    // Create metadata file path
    const metadataPath = path.join(imagesDir, `${id}.json`);
    
    const metadata = {
      id,
      name: name || '',
      category: category || 'hero',
      alt: alt || '',
      description: description || '',
      tags: Array.isArray(tags) ? tags : [],
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
      updatedAt: new Date().toISOString()
    };
    
    // Write metadata file
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✅ Updated metadata for image: ${id}`);
    res.json({ 
      message: 'Image metadata updated successfully',
      metadata 
    });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({ 
      message: 'Error updating image metadata',
      error: error.message 
    });
  }
});

export default router;
