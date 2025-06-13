import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_URL = 'http://localhost:5000'; // Change this to your server URL
const UPLOAD_ENDPOINT = '/api/upload/multiple';
const BATCH_SIZE = 5; // Number of images to upload per batch
const DELAY_BETWEEN_BATCHES = 1000; // Delay in milliseconds between batches

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

/**
 * Get all image files from a directory
 * @param {string} dirPath - Path to the directory containing images
 * @returns {Array} Array of image file paths
 */
function getImageFiles(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_FORMATS.includes(ext);
      })
      .map(file => path.join(dirPath, file));
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return [];
  }
}

/**
 * Upload a batch of images
 * @param {Array} imagePaths - Array of image file paths
 * @param {number} batchNumber - Current batch number
 * @returns {Object} Upload result
 */
async function uploadBatch(imagePaths, batchNumber) {
  const formData = new FormData();
  
  // Add each image to the form data
  imagePaths.forEach((imagePath, index) => {
    try {
      const fileStream = fs.createReadStream(imagePath);
      const fileName = path.basename(imagePath);
      formData.append('images', fileStream, fileName);
    } catch (error) {
      console.error(`Error reading file ${imagePath}:`, error.message);
    }
  });

  try {
    console.log(`\n📤 Uploading batch ${batchNumber} (${imagePaths.length} images)...`);
    
    const response = await fetch(`${SERVER_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Batch ${batchNumber} uploaded successfully!`);
      console.log(`   - Successful: ${result.uploadDetails.successful}`);
      console.log(`   - Failed: ${result.uploadDetails.failed}`);
      console.log(`   - Total size: ${formatFileSize(result.uploadDetails.totalSize)}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`   - Errors:`);
        result.errors.forEach(error => {
          console.log(`     • ${error.originalName}: ${error.error}`);
        });
      }
      
      return {
        success: true,
        imageUrls: result.imageUrls,
        details: result.uploadDetails,
        errors: result.errors || []
      };
    } else {
      console.error(`❌ Batch ${batchNumber} failed:`, result.message);
      return {
        success: false,
        error: result.message,
        imageUrls: [],
        errors: []
      };
    }
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      imageUrls: [],
      errors: []
    };
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main bulk upload function
 * @param {string} imageDirectory - Path to directory containing images
 */
async function bulkUpload(imageDirectory) {
  console.log('🚀 Starting bulk image upload...');
  console.log(`📁 Source directory: ${imageDirectory}`);
  console.log(`🌐 Server URL: ${SERVER_URL}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} images per batch`);
  console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
  
  // Check if directory exists
  if (!fs.existsSync(imageDirectory)) {
    console.error(`❌ Directory not found: ${imageDirectory}`);
    return;
  }

  // Get all image files
  const imageFiles = getImageFiles(imageDirectory);
  
  if (imageFiles.length === 0) {
    console.log('❌ No image files found in the specified directory.');
    console.log(`   Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
    return;
  }

  console.log(`📸 Found ${imageFiles.length} image files`);
  
  // Calculate total file size
  const totalSize = imageFiles.reduce((acc, filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return acc + stats.size;
    } catch (error) {
      return acc;
    }
  }, 0);
  
  console.log(`📊 Total size: ${formatFileSize(totalSize)}`);

  // Split into batches
  const batches = [];
  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    batches.push(imageFiles.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Split into ${batches.length} batches`);

  // Upload statistics
  const stats = {
    totalFiles: imageFiles.length,
    totalBatches: batches.length,
    successfulUploads: 0,
    failedUploads: 0,
    uploadedUrls: [],
    errors: []
  };

  // Upload each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNumber = i + 1;
    
    const result = await uploadBatch(batch, batchNumber);
    
    if (result.success) {
      stats.successfulUploads += result.details.successful;
      stats.failedUploads += result.details.failed;
      stats.uploadedUrls.push(...result.imageUrls);
      stats.errors.push(...result.errors);
    } else {
      stats.failedUploads += batch.length;
      stats.errors.push({
        batch: batchNumber,
        error: result.error,
        files: batch.map(f => path.basename(f))
      });
    }

    // Add delay between batches (except for the last batch)
    if (i < batches.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  // Print final statistics
  console.log('\n📊 Upload Summary:');
  console.log('='.repeat(50));
  console.log(`📁 Total files processed: ${stats.totalFiles}`);
  console.log(`✅ Successful uploads: ${stats.successfulUploads}`);
  console.log(`❌ Failed uploads: ${stats.failedUploads}`);
  console.log(`📦 Total batches: ${stats.totalBatches}`);
  console.log(`🔗 Uploaded URLs: ${stats.uploadedUrls.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach((error, index) => {
      if (error.batch) {
        console.log(`   Batch ${error.batch}: ${error.error}`);
        console.log(`   Files: ${error.files.join(', ')}`);
      } else {
        console.log(`   ${error.originalName}: ${error.error}`);
      }
    });
  }

  if (stats.uploadedUrls.length > 0) {
    console.log('\n🔗 Uploaded image URLs:');
    stats.uploadedUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
  }

  console.log('\n🎉 Bulk upload completed!');
}

// Command line usage
if (process.argv.length < 3) {
  console.log('Usage: node bulk-image-upload.js <image-directory>');
  console.log('Example: node bulk-image-upload.js ./product-images');
  process.exit(1);
}

const imageDirectory = process.argv[2];
bulkUpload(imageDirectory).catch(error => {
  console.error('❌ Bulk upload failed:', error.message);
  process.exit(1);
});

export { bulkUpload, getImageFiles, uploadBatch }; 