import { useState } from 'react';

export default function NumberField({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  min = null,
  max = null,
  step = "1",
  className = "",
  inputProps = {},
  ...props 
}) {
  const [error, setError] = useState('');

  const validateNumber = (inputValue) => {
    if (required && (!inputValue || inputValue.trim() === '')) {
      setError(`${label} is required`);
      return false;
    }

    if (inputValue && inputValue.trim() !== '') {
      const numValue = parseFloat(inputValue);
      
      if (isNaN(numValue)) {
        setError(`${label} must be a valid number`);
        return false;
      }

      if (min !== null && numValue < min) {
        setError(`${label} must be at least ${min}`);
        return false;
      }

      if (max !== null && numValue > max) {
        setError(`${label} must be no more than ${max}`);
        return false;
      }

      // Check for step validity
      if (step && step !== "any") {
        const stepNum = parseFloat(step);
        if (stepNum > 0 && (numValue - (min || 0)) % stepNum !== 0) {
          setError(`${label} must be a multiple of ${step}`);
          return false;
        }
      }
    }

    setError('');
    return true;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);
    validateNumber(newValue);
  };

  const handleBlur = (e) => {
    validateNumber(e.target.value);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-text-primary"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none transition-colors ${
          error 
            ? 'border-red-500 bg-red-50 focus:ring-red-500' 
            : 'border-border-light focus:border-brand-blue'
        }`}
        {...inputProps}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <i className="fa-solid fa-exclamation-triangle"></i>
          {error}
        </p>
      )}
    </div>
  );
}
