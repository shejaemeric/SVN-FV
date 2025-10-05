import { useEffect, useState, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import Card from '../components/Card';
import FormField from '../components/FormField';
import NumberField from '../components/NumberField';
import SectionBlock from '../components/SectionBlock';
import Modal from '../components/Modal';
import SelectField from '../components/SelectField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ErrorToast from '../components/ErrorToast';
import { productAPI, invoiceAPI, supplierAPI } from '../services/api';

export default function AddBatch() {
  const [productId, setProductId] = useState('');
  const [latestTax, setLatestTax] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturerBatchId, setManufacturerBatchId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [showNewProductPrompt, setShowNewProductPrompt] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [error, setError] = useState("");
  
  // New state for the requested functionality
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showScanningModal, setShowScanningModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  
  // Product creation form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    qr_code: '',
    size: 0,
    unit: '',
    image_path: 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'
  });

  // Fetch products function
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await productAPI.getAllProducts();
      console.log('Products fetched successfully:', response);
      const productsData = Array.isArray(response) ? response : (response.data || response.products || []);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch suppliers function
  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const response = await supplierAPI.getAllSuppliers();
      console.log('Suppliers fetched successfully:', response);
      const suppliersData = Array.isArray(response) ? response : (response.data || response.suppliers || []);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Handle product selection
  const handleProductSelect = useCallback((productId) => {
    console.log(productId);
    const product = products.find(p => p.product_id === productId);
    if (product) {
      setSelectedProduct(productId);
      setProductId(product.qr_code);
      setShowNewProductPrompt(false);
    }
  }, [products]);

  // Handle scan barcode
  const handleScanBarcode = () => {
    setShowScanningModal(true);
    // In a real implementation, this would integrate with a barcode scanner
    // For now, we'll simulate the scanning process
    setTimeout(() => {
      setShowScanningModal(false);
      // For demo purposes, simulate a successful scan
      const scannedProduct = products[0];
      if (scannedProduct) {
        handleProductSelect(scannedProduct.product_id);
      }
    }, 3000);
  };

  // Handle create product
  const handleCreateProduct = () => {
    setShowCreateProductModal(true);
  };

  // Handle product creation submit
  const handleProductSubmit = async () => {
    // Validate required fields
    if (!newProduct.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!newProduct.qr_code.trim()) {
      setError('QR code is required.');
      return;
    }
    if (!newProduct.unit) {
      setError('Unit is required.');
      return;
    }

    try {
      const response = await productAPI.createProduct(newProduct);
      console.log('Product created successfully:', response);
      
      // Refresh the products list
      await fetchProducts();
      
      setShowCreateProductModal(false);
      setNewProduct({ 
        name: '', 
        qr_code: '', 
        size: 0, 
        unit: '', 
        image_path: 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'
      });
      setError('');
      
      alert('Product created successfully!');
    } catch (error) {
      console.error('Failed to create product:', error);
      setError(error.message || 'Failed to create product. Please try again.');
    }
  };


  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if(productId){
    const lower = productId.toLowerCase();
    if (lower === 'new') {
      setShowNewProductPrompt(true);
  
    } else if (productId.length > 3) {
        // Check if this QR code matches any existing product
        const product = products.find(p => p.qr_code === productId);
        if (product) {
          handleProductSelect(product.product_id);
        } else {
      setShowNewProductPrompt(false);
  
        }
    } else {
      setShowNewProductPrompt(false);
    }
    }
  }, [productId, products, handleProductSelect]);

  const handleSave = async () => {
    // Validate required fields
    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }
    if (!selectedSupplier) {
      setError('Please select a supplier.');
      return;
    }
    if (!buyingPrice || parseInt(buyingPrice) <= 0) {
      setError('Please enter a valid buying price (must be a positive integer).');
      return;
    }
    if (!batchNumber || parseInt(batchNumber) <= 0) {
      setError('Please enter a valid number of items (must be a positive integer).');
      return;
    }
    if (!latestTax || parseInt(latestTax) < 0) {
      setError('Please enter a valid tax rate (must be a non-negative integer).');
      return;
    }

    try {
      // Validate data types before sending
      const buyingPriceInt = parseInt(buyingPrice);
      const batchNumberInt = parseInt(batchNumber);
      const taxInt = parseInt(latestTax);
      
      // Ensure all numeric values are valid integers
      if (!Number.isInteger(buyingPriceInt) || buyingPriceInt <= 0) {
        setError('Buying price must be a positive integer.');
        return;
      }
      if (!Number.isInteger(batchNumberInt) || batchNumberInt <= 0) {
        setError('Number of items must be a positive integer.');
        return;
      }
      if (!Number.isInteger(taxInt) || taxInt < 0) {
        setError('Tax rate must be a non-negative integer.');
        return;
      }

      // Prepare stock data according to the exact API specification
      const stockData = {
        stock_creators: [{
          product_id: selectedProduct,        // Uuid
          buying_price: buyingPriceInt,       // i32
          expiry_date: expiryDate || null,    // Option<NaiveDate>
          manufacturer_batch_id: manufacturerBatchId || null, // Option<String>
          number: batchNumberInt,            // i32
          tax: taxInt                        // i32
        }],
        supplier_id: selectedSupplier
      };

      const response = await invoiceAPI.createInvoice(stockData);
      console.log('Invoice created successfully:', response);
      
      // Show success message
      alert('Stock entry created successfully!');
      setError('');
      
      // Clear the form
      handleClear();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setError(error.message || 'Failed to create batch. Please check your input and try again.');
    }
  };

  const handleClear = () => {
    setProductId('');
    setLatestTax('');
    setBuyingPrice('');
    setExpiryDate('');
    setManufacturerBatchId('');
    setBatchNumber('');
    setShowNewProductPrompt(false);
    setSelectedProduct('');
    setSelectedSupplier('');
  };

  // Header buttons
  const headerButtons = (
    <div className="flex gap-3">
      <SecondaryButton onClick={handleCreateProduct}>
        <i className="fa-solid fa-plus mr-2" />
        Create Product
      </SecondaryButton>
      <SecondaryButton onClick={handleScanBarcode}>
        <i className="fa-solid fa-barcode mr-2" />
        Scan Barcode
      </SecondaryButton>
    </div>
  );

  return (
    <>
      <ErrorToast error={error} onClose={() => setError("")} />
      
    <PageLayout mainId="add-batch-page">
      <Header title="Add New Batch" subtitle="Enter batch details for a new or existing product." right={headerButtons} />

      <div id="batch-entry-form" className="grid grid-row-1 lg:grid-row-1 gap-6">
        {/* Left Panel: Form Fields */}
        <Card className="lg:col-span-2">
          <div className="space-y-5">
            <div id="scan-product-section">
              <FormField
                id="product_id"
                label="Scan Product Code (Barcode/QR)"
                placeholder="Scan or enter code to auto-fill details"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                leftIconClass="fa-solid fa-barcode"
                inputProps={{ className: 'w-full pl-12 pr-4 py-3 bg-gray-50 border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow' }}
              />
            </div>

            <SectionBlock title="Product Selection">
              <div className="space-y-4">
                <div>
                  <label htmlFor="product-select" className="block text-sm font-medium text-text-primary mb-2">
                    Select Product
                  </label>
                  <SelectField
                    id="product-select"
                    value={selectedProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    options={products.map(product => ({
                      value: product.product_id,
                      label: `${product.name}`
                    }))}
                    placeholder="Select a product..."
                    searchable={true}
                    searchPlaceholder="Search products..."
                    className="w-full"
                  />
                </div>
                <SecondaryButton 
                  onClick={fetchProducts}
                  disabled={isLoadingProducts}
                  className="w-full"
                >
                  {isLoadingProducts ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Loading Products...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-refresh mr-2" />
                      Refresh Products
                    </>
                  )}
                </SecondaryButton>
              </div>
            </SectionBlock>

            <SectionBlock title="Supplier Selection">
              <div className="space-y-4">
                <div>
                  <label htmlFor="supplier-select" className="block text-sm font-medium text-text-primary mb-2">
                    Select Supplier
                  </label>
                  <SelectField
                    id="supplier-select"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    options={suppliers.map(supplier => ({
                      value: supplier.supplier_id || supplier.id,
                      label: supplier.name || supplier.supplier_name || `Supplier ${supplier.supplier_id || supplier.id}`
                    }))}
                    placeholder="Select a supplier..."
                    searchable={true}
                    searchPlaceholder="Search suppliers..."
                    className="w-full"
                />
                </div>
                <SecondaryButton 
                  onClick={fetchSuppliers}
                  disabled={isLoadingSuppliers}
                  className="w-full"
                >
                  {isLoadingSuppliers ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Loading Suppliers...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-refresh mr-2" />
                      Refresh Suppliers
                    </>
                  )}
                </SecondaryButton>
                {showNewProductPrompt && (
                  <div>
                    <p className="text-sm text-sky-600 bg-sky-50 p-3 rounded-lg">
                      <i className="fa-solid fa-info-circle mr-2" />
                      New product detected. Please fill in the details below.
                    </p>
                  </div>
                )}
              </div>
            </SectionBlock>

            <SectionBlock title="Stock Creation Details">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberField
                    id="buying_price"
                    label="Buying Price (RWF)"
                    placeholder="Enter buying price"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    required={true}
                    min={1}
                    step="1"
                  />
                  <NumberField
                    id="latest_tax"
                    label="Tax Rate (%)"
                    placeholder="Enter tax rate"
                    value={0}
                    onChange={(e) => setLatestTax(e.target.value)}
                    required={true}
                    min={0}
                    disabled={true}
                    step="1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="expiry_date"
                    label="Expiry Date (Optional)"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    inputProps={{ className: 'w-full px-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-text-secondary' }}
                  />
                  <FormField
                    id="manufacturer_batch_id"
                    label="Manufacturer Batch ID (Optional)"
                    placeholder="e.g., MFR-XYZ-123"
                    value={manufacturerBatchId}
                    onChange={(e) => setManufacturerBatchId(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <NumberField
                    id="number"
                    label="Number of Items"
                    placeholder="Enter number of items"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    required={true}
                    min={1}
                    step="1"
                  />
                </div>
                
{/*                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Stock Creation Fields:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>product_id:</strong> UUID (auto-selected from product)</li>
                    <li>• <strong>buying_price:</strong> i32 (integer price in RWF)</li>
                    <li>• <strong>expiry_date:</strong> Optional date (YYYY-MM-DD format)</li>
                    <li>• <strong>manufacturer_batch_id:</strong> Optional string</li>
                    <li>• <strong>number:</strong> i32 (integer quantity)</li>
                    <li>• <strong>tax:</strong> i32 (integer tax rate)</li>
                  </ul>
                </div> */}
              </div>
            </SectionBlock>
          </div>
        </Card>

        {/* Right Panel: Actions */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="space-y-3 flex justify-around">
              <PrimaryButton className='!mr-0 !px-4 !w-fit !mr-0' onClick={handleSave} >
                <i className="fa-solid fa-check-circle mr-2" />Create Stock Entry
              </PrimaryButton>
              <SecondaryButton className='!px-4 !w-fit !font-bold !mr-0' onClick={handleClear}>
                <i className="fa-solid fa-eraser mr-2" />Clear Form
              </SecondaryButton>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal isOpen={showCreateProductModal} onClose={() => setShowCreateProductModal(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Create New Product</h3>
          <div className="space-y-3">
            <FormField
              id="new-product-name"
              label="Product Name"
              placeholder="Enter product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <FormField
              id="new-product-qr"
              label="QR Code"
              placeholder="Enter QR code"
              value={newProduct.qr_code}
              onChange={(e) => setNewProduct({...newProduct, qr_code: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
                              <NumberField
                  id="new-product-size"
                  label="Size"
                  placeholder="Size"
                  value={newProduct.size.toString()}
                  onChange={(e) => setNewProduct({...newProduct, size: parseInt(e.target.value) || 0})}
                  min={0}
                  step="1"
                />
                             <SelectField
                 id="new-product-unit"
                 value={newProduct.unit}
                 onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                 options={[
                   { value: 'g', label: 'Grams (g)' },
                   { value: 'ml', label: 'Milliliters (ml)' }
                 ]}
                 placeholder="Select unit..."
               />
            </div>
            {/* Image Upload Disabled - Using Default Image */}
            <FormField
              id="new-product-image"
              label="Product Image (Default)"
              placeholder="Using default product image"
              value="https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw"
              onChange={(e) => setNewProduct({...newProduct, image_path: e.target.value})}
              inputProps={{ 
                className: 'w-full px-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-text-secondary',
                readOnly: true
              }}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <PrimaryButton onClick={handleProductSubmit} className="flex-1">
              Create Product
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowCreateProductModal(false)} className="flex-1">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Scanning Modal */}
      <Modal isOpen={showScanningModal} onClose={() => setShowScanningModal(false)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-barcode text-2xl text-sky-600"></i>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Waiting for Scan</h3>
          <p className="text-text-secondary">Please scan the barcode or QR code...</p>
          <div className="w-8 h-8 mx-auto border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Modal>
    </PageLayout>
  </>
  );
}
