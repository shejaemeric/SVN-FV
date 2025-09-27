import { useState, useEffect } from 'react';

export default function NotificationToast({ 
  message, 
  type = 'error', 
  onClose, 
  autoClose = true, 
  duration = 5000,
  title = null 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose(), 300); // Wait for animation to complete
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, autoClose, duration, onClose]);

  if (!message) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200 text-green-700',
          icon: 'fa-solid fa-check-circle text-green-500',
          closeButton: 'text-green-500 hover:text-green-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border border-blue-200 text-blue-700',
          icon: 'fa-solid fa-info-circle text-blue-500',
          closeButton: 'text-blue-500 hover:text-blue-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
          icon: 'fa-solid fa-exclamation-triangle text-yellow-500',
          closeButton: 'text-yellow-500 hover:text-yellow-700'
        };
      default: // error
        return {
          container: 'bg-red-50 border border-red-200 text-red-700',
          icon: 'fa-solid fa-exclamation-triangle text-red-500',
          closeButton: 'text-red-500 hover:text-red-700'
        };
    }
  };

  const styles = getNotificationStyles(type);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${styles.container} px-4 py-3 rounded-lg shadow-lg max-w-md`}>
        <div className="flex items-start gap-3">
          <i className={`${styles.icon} mt-0.5 flex-shrink-0`}></i>
          <div className="flex-1">
            {title && (
              <p className="text-sm font-semibold mb-1">{title}</p>
            )}
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className={`${styles.closeButton} transition-colors flex-shrink-0`}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep the old ErrorToast for backward compatibility
export function ErrorToast({ error, onClose, autoClose = true, duration = 5000 }) {
  return (
    <NotificationToast 
      message={error} 
      type="error" 
      onClose={onClose} 
      autoClose={autoClose} 
      duration={duration} 
    />
  );
}
