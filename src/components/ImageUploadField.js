import { useState, useRef } from 'react';
import { imageUploadService } from '../services/firebase';

export default function ImageUploadField({ 
  value, 
  onChange, 
  label = "Product Image",
  placeholder = "Upload product image...",
  className = ""
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setError('');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Firebase
      const result = await imageUploadService.uploadImage(file, 'products');

      if (result.success) {
        onChange({ target: { value: result.url } });
        setError('');
      } else {
        setError(result.message);
        setPreview('');
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setPreview('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      await handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeImage = () => {
    setPreview('');
    setError('');
    onChange({ target: { value: '' } });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${error ? 'border-red-300 bg-red-50' : 'border-border-light hover:border-sky-300 hover:bg-sky-50'}
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {/* Upload Icon */}
        <div className="mb-4">
          {isUploading ? (
            <div className="w-12 h-12 mx-auto bg-sky-100 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : preview ? (
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-green-600 text-lg"></i>
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-lg"></i>
            </div>
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {isUploading ? (
            <div>
              <p className="text-sm font-medium text-sky-600">Uploading image...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : preview ? (
            <div>
              <p className="text-sm font-medium text-green-600">Image uploaded successfully!</p>
              <p className="text-xs text-text-secondary">Click to change image</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-text-primary">
                Drop your image here or click to browse
              </p>
              <p className="text-xs text-text-secondary">
                Supports JPEG, PNG, WebP (max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Product preview"
            className="w-full h-32 object-cover rounded-lg border border-border-light"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xs"></i>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {value && !error && !isUploading && (
        <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <i className="fa-solid fa-check-circle"></i>
          <span>Image uploaded successfully!</span>
        </div>
      )}
    </div>
  );
} 