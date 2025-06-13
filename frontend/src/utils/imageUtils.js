/**
 * Utility functions for handling images in the application
 */

/**
 * Get the full image URL based on the environment
 * @param {string} imagePath - The original image path
 * @returns {string} - The full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If the image is already a full URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a local image from the public folder
  if (imagePath.startsWith('/')) {
    return process.env.PUBLIC_URL + imagePath;
  }

  // For relative paths
  return imagePath;
};

/**
 * Handle image loading errors by setting a fallback image
 * @param {Event} event - The error event
 * @param {string} fallbackImage - The fallback image path to use
 */
export const handleImageError = (event, fallbackImage = '/images/sample.jpg') => {
  const img = event.target;
  if (img && img.src !== fallbackImage) {
    img.src = fallbackImage;
  }
}; 