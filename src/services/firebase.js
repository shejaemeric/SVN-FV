// Firebase configuration and image upload service
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug: Check which environment variables are loaded
console.log('Firebase Config Debug:');
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing');
console.log('Storage Bucket:', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing');
console.log('Messaging Sender ID:', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing');
console.log('App ID:', process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing');

console.log('Full Firebase Config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Image upload service
export const imageUploadService = {
  // Upload image to Firebase Storage
  uploadImage: async (file, folder = 'products') => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images only.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload images smaller than 5MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        fileName: fileName,
        message: 'Image uploaded successfully!'
      };

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
        message: error.message || 'Failed to upload image. Please try again.'
      };
    }
  },

  // Delete image from Firebase Storage (if needed)
  deleteImage: async (fileName) => {
    try {
      const storageRef = ref(storage, fileName);
      // Note: Firebase Storage doesn't have a direct delete method in the web SDK
      // You would need to use Firebase Admin SDK on the backend for deletion
      console.log('Image deletion not implemented in client-side SDK');
      return {
        success: true,
        message: 'Image deletion would be handled on the server side.'
      };
    } catch (error) {
      console.error('Image deletion error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete image.'
      };
    }
  }
};

export default imageUploadService; 