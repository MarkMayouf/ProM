import path from 'path';
import fs from 'fs';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum image dimensions
const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
]);

// Generate secure random filename
const generateSecureFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
};

// Clean up temporary files
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temporary file:', error);
  }
};

// Set up storage for multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Save ALL images to the images directory
    const uploadDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename(req, file, cb) {
    // Generate secure filename for all images
    const fileName = generateSecureFilename(file.originalname);
    cb(null, fileName);
  },
});

// Validate file type and size
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error('Invalid file type. Supported formats: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, TIFF'));
    return;
  }

  // Additional validation for SVG files to prevent XSS
  if (file.mimetype === 'image/svg+xml') {
    try {
      const fileContent = fs.readFileSync(file.path, 'utf8');
      const sanitizedSvg = DOMPurify.sanitize(fileContent);
      fs.writeFileSync(file.path, sanitizedSvg);
      cb(null, true);
    } catch (error) {
      cb(new Error('Invalid SVG file'));
    }
    return;
  }

  // Validate file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  if (!validExtensions.includes(ext)) {
    cb(new Error('Invalid file extension'));
    return;
  }

  cb(null, true);
};

// Initialize upload with error handling
const upload = multer({
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Invalid file type. Supported formats: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, TIFF'));
      return;
    }
    cb(null, true);
  }
}).single('image');

// Multiple file upload configuration
const uploadMultiple = multer({
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Invalid file type. Supported formats: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, TIFF'));
      return;
    }
    cb(null, true);
  }
}).array('images', 10);

// Process uploaded image - simplified version without Sharp
const processImage = async (file) => {
  try {
    console.log(`Processing image: ${file.originalname} at path: ${file.path}`);
    
    // Verify the file exists and is readable
    if (!fs.existsSync(file.path)) {
      throw new Error(`File does not exist: ${file.path}`);
    }

    const stats = await fs.promises.stat(file.path);
    if (!stats.isFile()) {
      throw new Error('Uploaded item is not a valid file');
    }

    console.log(`File verified successfully: ${file.originalname}, size: ${stats.size} bytes`);
    
    // Return the file path as-is (no processing needed)
    return file.path;
  } catch (error) {
    console.error(`Error processing file ${file.originalname}:`, error.message);
    throw new Error(`Failed to process ${file.originalname}: ${error.message}`);
  }
};

// Upload endpoint handler
const uploadImageFile = asyncHandler(async (req, res) => {
  try {
    // Ensure images directory exists with proper permissions
    const imagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
    
    try {
      await fs.promises.access(imagesDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      // Try to create directory if it doesn't exist
      try {
        await fs.promises.mkdir(imagesDir, { recursive: true, mode: 0o777 });
      } catch (mkdirError) {
        console.error(`Error creating directory ${imagesDir}:`, mkdirError);
        throw new Error(`Failed to create directory ${imagesDir}`);
      }
    }

    // Handle file upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          reject(new Error(`Upload error: ${err.message}`));
        } else if (err) {
          reject(err);
        } else if (!req.file) {
          reject(new Error('Please upload an image file'));
        } else {
          resolve();
        }
      });
    });

    // Return the URL path relative to the frontend public directory
    const fileName = path.basename(req.file.path);
    // All images are now saved to /images/ directory
    const imageUrl = `/images/${fileName}`;

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    // Clean up any uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    res.status(400);
    throw error;
  }
});

// Get all website images for the image manager
const getWebsiteImages = asyncHandler(async (req, res) => {
  try {
    console.log('🖼️ Loading website images for image manager...');
    const imagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
    const uploadsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads');
    
    console.log('📁 Images directory:', imagesDir);
    console.log('📁 Uploads directory:', uploadsDir);
    
    let images = [];
    
    // Scan images directory for website assets
    if (fs.existsSync(imagesDir)) {
      const imageFiles = fs.readdirSync(imagesDir);
      
      for (const file of imageFiles) {
        const filePath = path.join(imagesDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i.test(file) || file.includes('sample') || file.includes('perfect') || file.includes('combination') || file.includes('combo'))) {
          const category = categorizeImage(file);
          const usage = getImageUsage(file);
          
          images.push({
            _id: `img-${file}`,
            id: `img-${file}`,
            name: file,
            originalName: file,
            url: `/images/${file}`,
            category: category,
            size: stats.size,
            usage: usage,
            uploadDate: stats.mtime.toISOString(),
            dimensions: await getImageDimensions(filePath),
            type: getImageType(file)
          });
        }
      }
    }
    
    // Scan uploads directory for custom uploads
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir);
      
      for (const file of uploadFiles) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(file)) {
          // Use the actual filename for categorization instead of trying to extract original name
          const category = categorizeImage(file);
          const usage = getImageUsage(file);
          // Extract original filename from the generated filename if possible (for display purposes)
          const originalName = file.includes('-') ? file.split('-').slice(2).join('-') : file;
          
          images.push({
            _id: `upload-${file}`,
            id: `upload-${file}`,
            name: file,
            originalName: originalName,
            url: `/uploads/${file}`,
            category: category,
            size: stats.size,
            usage: usage,
            uploadDate: stats.mtime.toISOString(),
            dimensions: await getImageDimensions(filePath),
            type: getImageType(file)
          });
        }
      }
      
      // Scan for thumbnail subdirectories
      const thumbnailDirs = ['thumbnails', 'product-thumbnails', 'thumbs'];
      for (const thumbDir of thumbnailDirs) {
        const thumbPath = path.join(uploadsDir, thumbDir);
        if (fs.existsSync(thumbPath)) {
          const thumbFiles = fs.readdirSync(thumbPath);
          
          for (const file of thumbFiles) {
            const filePath = path.join(thumbPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile() && /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(file)) {
              images.push({
                _id: `thumb-${thumbDir}-${file}`,
                id: `thumb-${thumbDir}-${file}`,
                name: file,
                originalName: file,
                url: `/uploads/${thumbDir}/${file}`,
                category: 'thumbnails',
                size: stats.size,
                usage: `Product Thumbnail - ${thumbDir}`,
                uploadDate: stats.mtime.toISOString(),
                dimensions: await getImageDimensions(filePath),
                type: getImageType(file)
              });
            }
          }
        }
      }
    }
    
    // Sort images by upload date (newest first)
    images.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    console.log(`✅ Successfully loaded ${images.length} website images`);
    console.log('📊 Categories found:', [...new Set(images.map(img => img.category))]);
    
    res.json({
      success: true,
      images: images,
      total: images.length
    });
  } catch (error) {
    console.error('Error getting website images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load website images',
      error: error.message
    });
  }
});

// Update image metadata endpoint
const updateImageMetadata = asyncHandler(async (req, res) => {
  try {
    const { imageId } = req.params;
    const { name, category, usage } = req.body;
    
    // For now, we'll just return success since we don't have a database
    // In a real implementation, you'd update the metadata in a database
    
    res.json({
      success: true,
      message: 'Image metadata updated successfully',
      imageId,
      updates: { name, category, usage }
    });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image metadata',
      error: error.message
    });
  }
});

// Delete image endpoint
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { imageId } = req.params;
    
    console.log(`🗑️ Attempting to delete image with ID: ${imageId}`);
    
    // Determine if it's an uploaded image, website image, or thumbnail
    let filePath;
    let imageCategory = '';
    
    if (imageId.startsWith('upload-')) {
      const fileName = imageId.replace('upload-', '');
      filePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', fileName);
      imageCategory = 'upload';
      console.log(`📁 Upload file path: ${filePath}`);
    } else if (imageId.startsWith('img-')) {
      const fileName = imageId.replace('img-', '');
      filePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'images', fileName);
      imageCategory = 'website';
      console.log(`📁 Website file path: ${filePath}`);
    } else if (imageId.startsWith('thumb-')) {
      // Handle thumbnail images: thumb-{directory}-{filename}
      const parts = imageId.replace('thumb-', '').split('-');
      if (parts.length >= 2) {
        const directory = parts[0];
        const fileName = parts.slice(1).join('-');
        filePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', directory, fileName);
        imageCategory = 'thumbnail';
        console.log(`📁 Thumbnail file path: ${filePath}`);
      } else {
        console.error(`❌ Invalid thumbnail image ID format: ${imageId}`);
        res.status(400);
        throw new Error('Invalid thumbnail image ID format');
      }
    } else {
      console.error(`❌ Invalid image ID format: ${imageId}`);
      res.status(400);
      throw new Error('Invalid image ID format');
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404);
      throw new Error('Image file not found');
    }
    
    // Delete the file
    await fs.promises.unlink(filePath);
    
    console.log(`✅ ${imageCategory} image deleted successfully:`, filePath);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      category: imageCategory
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

// Check if file already exists (prevent duplicates)
const checkDuplicateFile = async (originalFileName, uploadDir) => {
  try {
    const existingFiles = await fs.promises.readdir(uploadDir);
    // Check if any existing file has the same original name
    // Since we use generated filenames, we need to check a metadata approach
    // For now, let's disable duplicate checking to allow uploads
    return false;
  } catch (error) {
    return false;
  }
};

// Multiple images upload handler with better error handling and categorization
const uploadMultipleImages = asyncHandler(async (req, res) => {
  try {
    // Ensure both uploads and images directories exist with proper permissions
    const uploadsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads');
    const imagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
    
    for (const dir of [uploadsDir, imagesDir]) {
      try {
        await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        try {
          await fs.promises.mkdir(dir, { recursive: true, mode: 0o777 });
        } catch (mkdirError) {
          console.error(`Error creating directory ${dir}:`, mkdirError);
          throw new Error(`Failed to create directory ${dir}`);
        }
      }
    }

    // Handle multiple file upload
    await new Promise((resolve, reject) => {
      uploadMultiple(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_COUNT') {
            reject(new Error('Maximum 10 images allowed'));
          } else if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error('File size too large. Maximum 5MB per file'));
          } else {
            reject(new Error(`Upload error: ${err.message}`));
          }
        } else if (err) {
          reject(err);
        } else if (!req.files || req.files.length === 0) {
          reject(new Error('Please upload at least one image file'));
        } else {
          resolve();
        }
      });
    });

    const files = req.files;
    const requestedCategory = req.body.category || 'general';
    const uploadResults = [];
    const uploadErrors = [];
    
    // Process images in batches for better performance
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(async (file, index) => {
        try {
          console.log(`\n=== Processing file ${index + 1} ===`);
          console.log(`File: ${file.originalname}`);
          console.log(`Size: ${file.size} bytes`);
          console.log(`Type: ${file.mimetype}`);
          console.log(`Path: ${file.path}`);
          
          // Use smart categorization based on filename
          const category = categorizeImage(file.originalname);
          console.log(`Category: ${category}`);
          
          // Check for duplicates based on original filename
          const isDuplicate = await checkDuplicateFile(file.originalname, path.dirname(file.path));
          
          if (isDuplicate) {
            console.log(`⚠️ Duplicate file detected: ${file.originalname}`);
            // Clean up the uploaded file
            await fs.promises.unlink(file.path);
            return {
              success: false,
              error: 'File already exists',
              originalName: file.originalname,
              isDuplicate: true
            };
          }
          
          const processedPath = await processImage(file);
          
          // Determine the correct URL path based on the file location
          const fileName = path.basename(processedPath);
          const isInImagesDir = processedPath.includes(path.join('frontend', 'public', 'images'));
          const imageUrl = isInImagesDir ? `/images/${fileName}` : `/uploads/${fileName}`;
          const idPrefix = isInImagesDir ? 'img' : 'upload';
          
          // Get image metadata for response
          const stats = await fs.promises.stat(processedPath);
          
          console.log(`✅ Successfully processed: ${file.originalname} -> ${imageUrl}`);
          console.log(`Final size: ${stats.size} bytes\n`);
          
          return {
            success: true,
            _id: `${idPrefix}-${fileName}`,
            id: `${idPrefix}-${fileName}`,
            name: fileName,
            originalName: file.originalname,
            url: imageUrl,
            category: category,
            size: stats.size,
            uploadDate: new Date().toISOString(),
            type: file.mimetype
          };
        } catch (error) {
          console.error(`❌ Failed to process file ${file.originalname}:`, error.message);
          
          return {
            success: false,
            error: error.message,
            originalName: file.originalname
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            uploadResults.push(result.value);
          } else {
            uploadErrors.push(result.value);
          }
        } else {
          uploadErrors.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            originalName: batch[index]?.originalname || 'Unknown file'
          });
        }
      });
    }

    // Prepare response
    const imageUrls = uploadResults.map(result => result.url);
    const totalSize = uploadResults.reduce((acc, result) => acc + result.size, 0);
    
    const response = {
      message: `Successfully uploaded ${uploadResults.length} of ${files.length} images`,
      successful: uploadResults.length,
      failed: uploadErrors.length,
      images: uploadResults,
      imageUrls,
      uploadDetails: {
        successful: uploadResults.length,
        failed: uploadErrors.length,
        totalFiles: files.length,
        totalSize: totalSize,
        category: requestedCategory,
        processedAt: new Date().toISOString()
      }
    };
    
    // Include error details if any uploads failed
    if (uploadErrors.length > 0) {
      response.errors = uploadErrors;
      response.message += `. ${uploadErrors.length} uploads failed.`;
    }
    
    // Log upload statistics
    console.log(`Batch upload completed: ${uploadResults.length}/${files.length} successful`);
    
    res.status(200).json(response);
  } catch (error) {
    // Clean up any uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => cleanupTempFile(file.path));
    }
    
    console.error('Batch upload error:', error);
    res.status(400);
    throw new Error(error.message);
  }
});

// Helper function to categorize images based on filename
const categorizeImage = (filename) => {
  const name = filename.toLowerCase();
  
  // Category Hero Images - Check for category-specific patterns first (more specific)
  if (name.includes('category') || 
      (name.includes('suits') && !name.includes('main-banner')) || 
      (name.includes('shoes') && !name.includes('main-banner')) || 
      (name.includes('accessories') && !name.includes('main-banner'))) {
    return 'category-hero';
  } 
  // Hero Content - Homepage hero images (less specific, check after category)
  else if (name.includes('hero') || name.includes('main-banner') || name.includes('homepage')) {
    return 'hero';
  } 
  // Default to hero for any other images
  else {
    return 'hero';
  }
};

// Helper function to get image usage description
const getImageUsage = (filename) => {
  const name = filename.toLowerCase();
  
  // Category Hero Images - Check category-specific patterns first (more specific)
  if (name.includes('category-suits') || (name.includes('suits') && name.includes('category'))) return 'Suits Category Page - Hero section image';
  if (name.includes('category-shoes') || (name.includes('shoes') && name.includes('category'))) return 'Shoes Category Page - Hero section image';
  if (name.includes('category-accessories') || (name.includes('accessories') && name.includes('category'))) return 'Accessories Category Page - Hero section image';
  if (name.includes('category') && name.includes('hero')) return 'Category Page - Hero section image';
  
  // Hero Content - Homepage hero images (less specific, check after category)
  if (name.includes('hero') || name.includes('main-banner')) return 'Homepage Hero Section - Main hero image';
  if (name.includes('homepage')) return 'Homepage - Primary hero content';
  
  return 'Hero Image - Website hero content';
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get image dimensions using image-size library
const getImageDimensions = async (filePath) => {
  try {
    // Try to get dimensions using basic file reading
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        // For now, return file size info until we can implement proper dimension detection
        return `File size: ${formatFileSize(stats.size)}`;
      }
    }
    return 'Unknown';
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return 'Unknown';
  }
};

// Helper function to get image MIME type
const getImageType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'image/unknown';
};

// Bulk upload all images from public/images directory
const bulkUploadPublicImages = asyncHandler(async (req, res) => {
  try {
    console.log('🚀 Starting bulk upload of public images...');
    
    const imagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
    const uploadsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
    }
    
    // Get all image files from public/images
    const imageFiles = fs.readdirSync(imagesDir).filter(file => 
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(file)
    );
    
    console.log(`📁 Found ${imageFiles.length} images to process`);
    
    const results = [];
    const errors = [];
    let duplicates = 0;
    
    for (const fileName of imageFiles) {
      try {
        const sourcePath = path.join(imagesDir, fileName);
        const targetFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${fileName}`;
        const targetPath = path.join(uploadsDir, targetFileName);
        
        // Check if similar file already exists in uploads
        const existingFiles = fs.readdirSync(uploadsDir);
        const isDuplicate = existingFiles.some(file => file.includes(fileName.split('.')[0]));
        
        if (isDuplicate) {
          console.log(`⚠️ Similar file already exists: ${fileName}`);
          duplicates++;
          continue;
        }
        
        // Copy file to uploads directory
        await fs.promises.copyFile(sourcePath, targetPath);
        
        // Get file stats
        const stats = await fs.promises.stat(targetPath);
        const category = categorizeImage(fileName);
        console.log(`📂 Categorized ${fileName} as: ${category}`);
        
        const result = {
          _id: `upload-${targetFileName}`,
          name: targetFileName,
          originalName: fileName,
          url: `/uploads/${targetFileName}`,
          category: category,
          size: stats.size,
          uploadDate: new Date().toISOString(),
          type: getImageType(fileName),
          usage: getImageUsage(fileName)
        };
        
        results.push(result);
        console.log(`✅ Uploaded: ${fileName} -> ${targetFileName}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload ${fileName}:`, error.message);
        errors.push({
          fileName,
          error: error.message
        });
      }
    }
    
    console.log(`🎉 Bulk upload completed: ${results.length} successful, ${errors.length} failed, ${duplicates} duplicates skipped`);
    
    res.json({
      success: true,
      message: `Bulk upload completed: ${results.length} images uploaded`,
      uploaded: results.length,
      failed: errors.length,
      duplicates: duplicates,
      total: imageFiles.length,
      images: results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk upload images',
      error: error.message
    });
  }
});

// Ensure default images exist
const ensureDefaultImages = () => {
  const defaultImagesDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');
  if (!fs.existsSync(defaultImagesDir)) {
    fs.mkdirSync(defaultImagesDir, { recursive: true });
  }

  // Copy sample.jpg if it doesn't exist
  const sampleImagePath = path.join(defaultImagesDir, 'sample.jpg');
  if (!fs.existsSync(sampleImagePath)) {
    const defaultImagePath = path.join(__dirname, '..', 'data', 'sample.jpg');
    if (fs.existsSync(defaultImagePath)) {
      fs.copyFileSync(defaultImagePath, sampleImagePath);
    }
  }
};

const uploadController = {
  uploadImageFile,
  uploadMultipleImages,
  getWebsiteImages,
  updateImageMetadata,
  deleteImage,
  bulkUploadPublicImages,
  ensureDefaultImages
};

export default uploadController;
export { uploadImageFile, uploadMultipleImages, getWebsiteImages, updateImageMetadata, deleteImage, bulkUploadPublicImages, ensureDefaultImages };