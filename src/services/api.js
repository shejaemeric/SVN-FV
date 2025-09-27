// API Base URL - update this to match your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log("API Response status:", response.status);
  console.log("API Response headers:", response.headers);
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
      console.error("API Error response:", errorData);
    } catch (parseError) {
      console.error("Failed to parse error response:", parseError);
      errorData = { message: `HTTP error! status: ${response.status}` };
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Get the content type to determine how to handle the response
  const contentType = response.headers.get('content-type');
  console.log("Response content type:", contentType);
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      console.log("API Success response (JSON):", data);
      
      // Check for error messages in successful responses
      if (data && typeof data === 'object') {
        // Check for common error indicators in the response
        if (data.error || data.message === 'DatabaseStoring' || data.error_message) {
          throw new Error(data.error || data.message || data.error_message || 'Database error occurred');
        }
      }
      
      return data;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      // Fallback to text if JSON parsing fails
      const text = await response.text();
      console.log("API Response text (fallback):", text);
      return text || response.statusText;
    }
  } else {
    // Handle non-JSON responses (like plain text, strings, etc.)
    try {
      const text = await response.text();
      console.log("API Success response (text):", text);
      
      // Try to parse as JSON if it looks like JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(text);
          console.log("API Success response (parsed JSON):", jsonData);
          
          // Check for error messages in parsed JSON
          if (jsonData && typeof jsonData === 'object') {
            if (jsonData.error || jsonData.message === 'DatabaseStoring' || jsonData.error_message) {
              throw new Error(jsonData.error || jsonData.message || jsonData.error_message || 'Database error occurred');
            }
          }
          
          return jsonData;
        } catch (jsonError) {
          // If JSON parsing fails, return the text as is
          return text;
        }
      }
      
      // Check for error messages in plain text responses
      if (text && (text.includes('DatabaseStoring') || text.includes('error') || text.includes('Error'))) {
        throw new Error(text || 'Database error occurred');
      }
      
      return text || response.statusText;
    } catch (textError) {
      console.error("Failed to get response text:", textError);
      return response.statusText;
    }
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  console.log("Making API request to:", url);
  console.log("Request config:", config);

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Product API Functions
export const productAPI = {
  // Get all products
  getAllProducts: async () => {
    return apiRequest('/get_all_products');
  },

  // Find product by QR code
  findProduct: async (qrCode) => {
    return apiRequest('/find_product', {
      method: 'GET',
      body: JSON.stringify({ qr_code: qrCode }),
    });
  },

  // Create new product
  createProduct: async (productData) => {
    const dataToSend = {
      name: productData.name,
      qr_code: productData.qr_code,
      size: parseInt(productData.size) || 0,
      unit: productData.unit,
      image_path: productData.image_path
    };
    
    return apiRequest('/create_product', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },

  // Edit product
  editProduct: async (productData) => {
    const dataToSend = {
      product_id: productData.product_id,
      name: productData.name,
      size: productData.size ? parseInt(productData.size) : undefined,
      unit: productData.unit
    };
    
    return apiRequest('/edit_product', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },

  // Delete product by QR code
  deleteProduct: async (qrCode) => {
    return apiRequest('/delete_product', {
      method: 'DELETE',
      body: qrCode, // Send QR code as plain string, not JSON
    });
  },
};

// Stock/Batch API Functions
export const stockAPI = {
  // Get all stocks
  getAllStocks: async () => {
    return apiRequest('/get_all_stocks');
  },

  // Get product batches by QR code
  getProductBatches: async (qrCode) => {
    return apiRequest('/get_product_batches', {
      method: 'GET',
      body: JSON.stringify(qrCode),
    });
  },

  // Find batch by ID
  findBatch: async (batchId) => {
    return apiRequest('/find_batch', {
      method: 'GET',
      body: JSON.stringify(batchId),
    });
  },

  // Edit batch
  editBatch: async (batchData) => {
    const dataToSend = {
      batch_id: batchData.batch_id,
      number: parseInt(batchData.number)
    };
    
    return apiRequest('/edit_batch', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },

  // Delete batch
  deleteBatch: async (batchId) => {
    return apiRequest('/delete_batch', {
      method: 'DELETE',
      body: JSON.stringify(batchId),
    });
  },

  // Delete all product batches by QR code
  deleteProductBatches: async (qrCode) => {
    return apiRequest('/delete_product_batches', {
      method: 'DELETE',
      body: JSON.stringify(qrCode),
    });
  },
};

// Supplier API Functions
export const supplierAPI = {
  // Get all suppliers
  getAllSuppliers: async () => {
    return apiRequest('/get_all_suppliers');
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    return apiRequest('/create_supplier', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  // Pay supplier
  paySupplier: async (paymentData) => {
    return apiRequest('/pay_supplier', {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  },

  // Get all supplier payments
  getAllSupplierPayments: async () => {
    return apiRequest('/get_all_supplier_payments');
  },

  // Find supplier payment
  findSupplierPayment: async (paymentData) => {
    return apiRequest('/find_supplier_payment', {
      method: 'GET',
      body: JSON.stringify(paymentData),
    });
  },

  // Edit supplier payment
  editSupplierPayment: async (paymentData) => {
    return apiRequest('/edit_supplier_payment', {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  },

  // Get supplier payments (alternative endpoint)
  getSupplierPayments: async () => {
    return apiRequest('/get_supplier_payments');
  },
};

// Sales API Functions
export const salesAPI = {
  // Get all sales
  getAllSales: async () => {
    return apiRequest('/get_all_sales');
  },
};

// Receipt API Functions
export const receiptAPI = {
  // Get all receipts
  getAllReceipts: async () => {
    return apiRequest('/get_all_receipts');
  },

  // Find receipt by ID
  findReceipt: async (receiptId) => {
    return apiRequest('/find_receipt', {
      method: 'GET',
      body: JSON.stringify(receiptId),
    });
  },

  // Create new receipt
  createReceipt: async (receiptData) => {
    const dataToSend = {
      sale_creators: receiptData.sale_creators || [],
      ...(receiptData.customer_id && { customer_id: receiptData.customer_id }),
      ...(receiptData.unpaid && { unpaid: parseInt(receiptData.unpaid || 0) })
    };
    
    return apiRequest('/create_receipt', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },
};

// Customer API Functions
export const customerAPI = {
  // Get all customers
  getAllCustomers: async () => {
    return apiRequest('/get_all_customers');
  },

  // Find customer by phone number
  findCustomer: async (phoneNumber) => {
    return apiRequest('/find_customer', {
      method: 'GET',
      body: JSON.stringify(phoneNumber),
    });
  },

  // Register customer
  registerCustomer: async (customerData) => {
    return apiRequest('/register_customer', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },
};

// Invoice API Functions
export const invoiceAPI = {
  // Create invoice
  createInvoice: async (invoiceData) => {
    const dataToSend = {
      stock_creators: invoiceData.stock_creators || [],
      supplier_id: invoiceData.supplier_id
    };
    
    return apiRequest('/create_invoice', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },

  // Find invoice by ID
  findInvoice: async (invoiceId) => {
    return apiRequest('/find_invoice', {
      method: 'GET',
      body: JSON.stringify(invoiceId),
    });
  },
};

// Scanning API Functions - Use productAPI.findProduct instead
export const scanAPI = {
  // Scan item by QR code - redirects to productAPI.findProduct
  scanItem: async (qrCode) => {
    return productAPI.findProduct(qrCode);
  },
};

// Utility function to handle errors
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  return error.message || 'An unexpected error occurred';
};

// Export all API functions as a single object for convenience
export const api = {
  products: productAPI,
  stocks: stockAPI,
  suppliers: supplierAPI,
  sales: salesAPI,
  receipts: receiptAPI,
  customers: customerAPI,
  invoices: invoiceAPI,
  scan: scanAPI,
};

export default api;
