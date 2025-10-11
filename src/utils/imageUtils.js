// Default fallback image for products
export const DEFAULT_PRODUCT_IMAGE = 'https://marketing-wala.com/wp-content/uploads/2024/08/4863042.webp';

// Handle image error by setting fallback
export const handleImageError = (event) => {
  event.target.src = DEFAULT_PRODUCT_IMAGE;
  event.target.onerror = null; // Prevent infinite loop if default image also fails
};

// Get image source with fallback
export const getImageSrc = (imagePath) => {
  return imagePath || DEFAULT_PRODUCT_IMAGE;
};

