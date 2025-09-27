# API Service Documentation

This directory contains the API service layer for communicating with the backend server.

## Configuration

### Environment Variables

Set the following environment variable in your `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

If not set, it defaults to `http://localhost:8000/api`.

## Usage

### Import the API service

```javascript
import { productAPI, batchAPI, scanAPI } from '../services/api';
// or import all APIs
import api from '../services/api';
```

### Product Operations

```javascript
// Get all products
const products = await productAPI.getAllProducts();

// Get product by ID
const product = await productAPI.getProductById('product-id');

// Get product by QR code
const product = await productAPI.getProductByQRCode('QR123');

// Create new product
const newProduct = await productAPI.createProduct({
  name: 'Product Name',
  qr_code: 'QR123',
  size: 150,
  unit: 'g',
  image_path: '/path/to/image.jpg'
});

// Update product
const updatedProduct = await productAPI.updateProduct('product-id', {
  name: 'Updated Name'
});

// Delete product
await productAPI.deleteProduct('product-id');
```

### Batch Operations

```javascript
// Get all batches
const batches = await batchAPI.getAllBatches();

// Create new batch
const newBatch = await batchAPI.createBatch({
  product_id: 'product-uuid',
  buying_price: 650, // in cents
  expiry_date: '2024-12-31',
  manufacturer_batch_id: 'MFR-123',
  number: 1,
  tax: 5,
  supplier_id: 'supplier-uuid',
  paid: true
});

// Get batches by product
const productBatches = await batchAPI.getBatchesByProduct('product-id');
```

### Scanning Operations

```javascript
// Scan item by QR code
const scannedItem = await scanAPI.scanItem('QR123');
```

### Error Handling

```javascript
import { handleAPIError } from '../services/api';

try {
  const result = await productAPI.getAllProducts();
} catch (error) {
  const errorInfo = handleAPIError(error);
  console.log(errorInfo.message);
}
```

## Data Structures

### ProductCreator
```javascript
{
  name: String,
  qr_code: String,
  size: Number,
  unit: String, // 'g' or 'ml'
  image_path: String // optional
}
```

### BatchCreator
```javascript
{
  product_id: String, // UUID
  buying_price: Number, // in cents
  expiry_date: String, // YYYY-MM-DD format, optional
  manufacturer_batch_id: String, // optional
  number: Number,
  tax: Number,
  supplier_id: String, // UUID
  paid: Boolean
}
```

## Available API Modules

- `productAPI` - Product management
- `batchAPI` - Batch management
- `scanAPI` - Barcode/QR scanning
- `supplierAPI` - Supplier management
- `inventoryAPI` - Inventory operations
- `posAPI` - Point of Sale operations
- `receiptAPI` - Receipt management
- `dashboardAPI` - Dashboard statistics

## Error Handling

The API service includes built-in error handling:

1. **Network Errors**: Automatically caught and logged
2. **HTTP Errors**: Response status codes are checked
3. **JSON Parsing**: Handles malformed JSON responses
4. **Fallback Data**: Uses sample data when API is unavailable

## Development Notes

- All API calls return promises
- Error handling is consistent across all functions
- The service is designed to work with RESTful APIs
- CORS headers are automatically included
- Content-Type is set to application/json for POST/PUT requests 