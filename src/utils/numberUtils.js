// Utility functions for number formatting

/**
 * Format a number with commas as thousands separators
 * @param {number|string} num - The number to format
 * @returns {string} - Formatted number with commas
 */
export const formatNumberWithCommas = (num) => {
  if (num === null || num === undefined || num === '') return '0';
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // Check if it's a valid number
  if (isNaN(number)) return '0';
  
  // Format with commas
  return number.toLocaleString('en-US');
};

/**
 * Format currency with commas and RWF prefix
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return 'RWF 0';
  
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(number)) return 'RWF 0';
  
  return `RWF ${number.toLocaleString('en-US')}`;
};

/**
 * Format currency without decimal places (for whole numbers)
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string without decimals
 */
export const formatCurrencyWhole = (amount) => {
  if (amount === null || amount === undefined || amount === '') return 'RWF 0';
  
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(number)) return 'RWF 0';
  
  return `RWF ${Math.round(number).toLocaleString('en-US')}`;
};

/**
 * Format percentage with commas
 * @param {number|string} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || value === '') return '0%';
  
  const number = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(number)) return '0%';
  
  return `${number.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number|string} num - The number to format
 * @returns {string} - Formatted number with suffix
 */
export const formatLargeNumber = (num) => {
  if (num === null || num === undefined || num === '') return '0';
  
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  } else {
    return number.toLocaleString('en-US');
  }
};

