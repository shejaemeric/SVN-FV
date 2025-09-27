# API Integration Guide

This document outlines the complete integration between the React frontend and the backend API based on the provided OpenAPI specification.

## Backend API Endpoints

The application now integrates with the following backend endpoints:

### Products
- `GET /get_all_products` - Retrieve all products
- `POST /create_product` - Create a new product
- `PATCH /edit_product` - Update an existing product
- `DELETE /delete_product` - Delete a product

### Batches
- `GET /get_all_batches` - Retrieve all batches
- `GET /get_product_batches` - Get batches for specific products
- `GET /find_batch` - Find a specific batch
- `PATCH /edit_batch` - Update a batch
- `DELETE /delete_batch` - Delete a batch
- `DELETE /delete_product_batches` - Delete all batches for a product

### Suppliers
- `GET /get_all_suppliers` - Retrieve all suppliers
- `POST /create_supplier` - Create a new supplier
- `PATCH /add_supplier_debt` - Add debt to a supplier
- `PATCH /pay_supplier` - Make payment to supplier

### Sales & Receipts
- `GET /get_all_sales` - Retrieve all sales
- `GET /get_all_receipts` - Retrieve all receipts
- `GET /find_receipt` - Find a specific receipt
- `POST /create_receipt` - Create a new receipt

### Customers
- `GET /get_all_customers` - Retrieve all customers
- `GET /find_customer` - Find a specific customer
- `POST /register_customer` - Register a new customer

### Invoices
- `POST /create_invoice` - Create a new invoice (for batch management)

### Scanning
- `GET /scan_item` - Scan an item by QR code

## Updated Components

### API Service (`src/services/api.js`)
- Completely rewritten to match backend API structure
- Proper error handling and response parsing
- Support for all backend endpoints
- Consistent data transformation

### Pages Updated

#### Inventory Page (`src/pages/Inventory.js`)
- Updated to use new product API endpoints
- Proper error handling for API responses
- Support for product creation, editing, and deletion
- Dynamic data loading from backend

#### POS Page (`src/pages/POS.js`)
- Updated to use new receipt API structure
- Customer selection integration
- Proper sale creation with backend format
- Real-time product loading

#### AddBatch Page (`src/pages/AddBatch.js`)
- Updated to use invoice API for batch creation
- Supplier integration
- Product and supplier data loading
- Proper batch data structure

#### Receipts Page (`src/pages/Receipts.js`)
- Updated to use new receipt API endpoints
- Proper data transformation for display
- Support for receipt filtering and sorting

#### Dashboard Page (`src/pages/Dashboard.js`)
- Real-time data loading from multiple APIs
- Dynamic statistics calculation
- Recent activity generation
- Error handling for API failures

## Data Structures

### Product Structure
```javascript
{
  product_id: string,
  name: string,
  qr_code: string,
  size: number,
  unit: string,
  image_path: string,
  stock?: number,
  selling_price?: number,
  untaxed_price?: number
}
```

### Receipt Structure
```javascript
{
  receipt_id: string,
  customer_id?: string,
  total: number,
  unpaid: number,
  sale_creators: Array<{
    number: number,
    qr_code: string
  }>,
  created_at: string
}
```

### Batch Structure (for Invoices)
```javascript
{
  batch_creators: Array<{
    product_id: string,
    buying_price: number,
    expiry_date: string,
    manufacturer_batch_id: string,
    number: number,
    tax: number,
    supplier_id: string
  }>,
  paid: number,
  supplier_id: string
}
```

## Environment Configuration

Create a `.env` file in the project root with:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Error Handling

The application includes comprehensive error handling:
- API response validation
- Network error handling
- User-friendly error messages
- Graceful fallbacks for missing data

## Testing the Integration

1. Start the backend server on `http://localhost:8000`
2. Update the `.env` file with your backend URL
3. Run `npm start` to start the React development server
4. Test each page to ensure proper API integration

## Key Features

- **Real-time Data**: All pages now load data from the backend API
- **Error Handling**: Comprehensive error handling throughout the application
- **Data Validation**: Proper data validation and transformation
- **User Experience**: Loading states and error messages for better UX
- **Scalability**: Modular API service structure for easy maintenance

## Notes

- All monetary values are handled in cents on the backend
- The frontend converts between cents and display values
- QR codes are used as primary identifiers for products
- The application gracefully handles missing or malformed data
- All API calls include proper error handling and user feedback
