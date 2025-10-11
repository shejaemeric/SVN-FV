// API Base URL - update this to match your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

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

  // Find product by QR code or product ID
  findProduct: async (query) => {
    // query can be { qr_code: "xxx" } or { product_id: "xxx" }
    const params = new URLSearchParams();
    if (query.qr_code) params.append('qr_code', query.qr_code);
    if (query.product_id) params.append('product_id', query.product_id);
    
    return apiRequest(`/find_product?${params.toString()}`);
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
      headers: {
        'Content-Type': 'text/plain',
      },
      body: qrCode,
    });
  },
};

// Stock API Functions
export const stockAPI = {
  // Get all stocks
  getAllStocks: async () => {
    return apiRequest('/get_all_stocks');
  },

  // Get product stock by QR code
  getProductStock: async (qrCode) => {
    return apiRequest(`/get_product_stock?qr_code=${encodeURIComponent(qrCode)}`);
  },

  // Find stock by ID
  findStock: async (stockId) => {
    return apiRequest(`/find_stock?stock_id=${encodeURIComponent(stockId)}`);
  },

  // Edit stock
  editStock: async (stockData) => {
    const dataToSend = {
      stock_id: stockData.stock_id,
      product_id: stockData.product_id,
      buying_price: stockData.buying_price,
      tax: stockData.tax,
      expiry_date: stockData.expiry_date,
      original_number_delta: stockData.original_number_delta,
      manufacturer_batch_id: stockData.manufacturer_batch_id
    };
    
    // Remove undefined fields
    Object.keys(dataToSend).forEach(key => dataToSend[key] === undefined && delete dataToSend[key]);
    
    return apiRequest('/edit_stock', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },

  // Delete stock by ID
  deleteStock: async (stockId) => {
    return apiRequest('/delete_stock', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: stockId,
    });
  },

  // Delete all product stock by QR code
  deleteProductStock: async (qrCode) => {
    return apiRequest('/delete_product_stock', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: qrCode,
    });
  },
};

// Supplier API Functions
export const supplierAPI = {
  // Get all suppliers
  getAllSuppliers: async () => {
    return apiRequest('/get_all_suppliers');
  },

  // Find supplier by ID
  findSupplier: async (supplierId) => {
    return apiRequest(`/find_supplier?supplier_id=${encodeURIComponent(supplierId)}`);
  },

  // Create new supplier (requires supplier name as string)
  createSupplier: async (supplierName) => {
    return apiRequest('/create_supplier', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: supplierName,
    });
  },

  // Pay supplier
  paySupplier: async (paymentData) => {
    const dataToSend = {
      id: paymentData.id,
      amount: parseInt(paymentData.amount)
    };
    
    return apiRequest('/pay_supplier', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },

  // Get all supplier payments
  getAllSupplierPayments: async () => {
    return apiRequest('/get_all_supplier_payments');
  },

  // Get supplier payments by supplier ID
  getSupplierPayments: async (supplierId) => {
    return apiRequest(`/get_supplier_payments?supplier_id=${encodeURIComponent(supplierId)}`);
  },

  // Find supplier payment by ID
  findSupplierPayment: async (paymentId) => {
    return apiRequest(`/find_supplier_payment?payment_id=${encodeURIComponent(paymentId)}`);
  },

  // Edit supplier payment
  editSupplierPayment: async (paymentData) => {
    const dataToSend = {
      payment_id: paymentData.payment_id,
      supplier_id: paymentData.supplier_id,
      amount: paymentData.amount
    };
    
    // Remove undefined fields
    Object.keys(dataToSend).forEach(key => dataToSend[key] === undefined && delete dataToSend[key]);
    
    return apiRequest('/edit_supplier_payment', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },
};

// Sales API Functions
export const salesAPI = {
  // Get all sales
  getAllSales: async () => {
    return apiRequest('/get_all_sales');
  },

  // Delete sale by ID
  deleteSale: async (saleId) => {
    return apiRequest('/delete_sale', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: saleId,
    });
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
    return apiRequest(`/find_receipt?receipt_id=${encodeURIComponent(receiptId)}`);
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

  // Edit receipt
  editReceipt: async (receiptData) => {
    const dataToSend = {
      receipt_id: receiptData.receipt_id,
      sale_creators: receiptData.sale_creators || [],
      ...(receiptData.customer_id && { customer_id: receiptData.customer_id }),
      ...(receiptData.unpaid && { unpaid: parseInt(receiptData.unpaid || 0) })
    };
    
    return apiRequest('/edit_receipt', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },

  // Delete receipt by ID
  deleteReceipt: async (receiptId) => {
    return apiRequest('/delete_receipt', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: receiptId,
    });
  },
};

// Customer API Functions
export const customerAPI = {
  // Get all customers
  getAllCustomers: async () => {
    return apiRequest('/get_all_customers');
  },

  // Find customer by ID
  findCustomer: async (customerId) => {
    return apiRequest(`/find_customer?customer_id=${encodeURIComponent(customerId)}`);
  },

  // Register customer
  registerCustomer: async (customerData) => {
    const dataToSend = {
      name: customerData.name,
      phone_number: customerData.phone_number,
      government_id: customerData.government_id
    };
    
    // Remove undefined fields
    Object.keys(dataToSend).forEach(key => dataToSend[key] === undefined && delete dataToSend[key]);
    
    return apiRequest('/register_customer', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  },

  // Edit customer (if backend supports it - not in provided docs, so commenting out)
  editCustomer: async (customerData) => {
    const dataToSend = {
      customer_id: customerData.customer_id,
      name: customerData.name,
      phone_number: customerData.phone_number,
      government_id: customerData.government_id
    };
    
    // Remove undefined fields
    Object.keys(dataToSend).forEach(key => dataToSend[key] === undefined && delete dataToSend[key]);
    
    return apiRequest('/edit_customer', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
    });
  },

  // Delete customer (if backend supports it - not in provided docs, so commenting out)
  deleteCustomer: async (customerId) => {
    return apiRequest('/delete_customer', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: customerId,
    });
  },

  // Credit customer
  creditCustomer: async (creditData) => {
    const dataToSend = {
      phone_number: creditData.phone_number,
      amount: parseInt(creditData.amount)
    };
    
    return apiRequest('/credit_customer', {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
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
    return apiRequest(`/find_invoice?invoice_id=${encodeURIComponent(invoiceId)}`);
  },

  // Delete invoice by ID
  deleteInvoice: async (invoiceId) => {
    return apiRequest('/delete_invoice', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: invoiceId,
    });
  },
};

// Scanning API Functions - Use productAPI.findProduct instead
export const scanAPI = {
  // Scan item by QR code - redirects to productAPI.findProduct
  scanItem: async (qrCode) => {
    return productAPI.findProduct({ qr_code: qrCode });
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
