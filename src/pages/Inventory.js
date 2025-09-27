import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import TableHeaderRow from '../components/TableHeaderRow';
import ProductRow from '../components/ProductRow';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import NotificationToast from '../components/ErrorToast';
import { productAPI, handleAPIError } from '../services/api';
import { exportTableToPDF, getTableColumns } from '../utils/exportUtils';

export default function Inventory() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('');
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [createProduct, setCreateProduct] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showStatusSettings, setShowStatusSettings] = useState(false);
  const navigate = useNavigate();

  // Status management settings
  const [statusSettings, setStatusSettings] = useState({
    inStockThreshold: 10,
    lowStockThreshold: 5
  });

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    qr_code: '',
    size: 0,
    unit: '',
    image_path: 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'
  });

  // Edit product form state
  const [editForm, setEditForm] = useState({
    product_id: '',
    name: '',
    size: 0,
    unit: ''
  });

  // Load status settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('inventoryStatusSettings');
    if (savedSettings) {
      setStatusSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save status settings to localStorage
  const saveStatusSettings = (newSettings) => {
    setStatusSettings(newSettings);
    localStorage.setItem('inventoryStatusSettings', JSON.stringify(newSettings));
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productAPI.getAllProducts();
      setProducts(response || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
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
      
      // Reset form and close modal
      setNewProduct({
        name: '',
        qr_code: '',
        size: 0,
        unit: '',
        image_path: 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'
      });
      setCreateProduct(false);
      setError('');
      setSuccess('Product created successfully!');
      
      // Refresh products list
      await fetchProducts();
    } catch (err) {
      console.error('Failed to create product:', err);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Failed to create product. Please try again.';
      
      if (err.message) {
        if (err.message.includes('DatabaseStoring')) {
          errorMessage = 'Database error: Unable to store product. Please check your data and try again.';
        } else if (err.message.includes('duplicate') || err.message.includes('already exists')) {
          errorMessage = 'A product with this QR code already exists. Please use a different QR code.';
        } else if (err.message.includes('validation') || err.message.includes('invalid')) {
          errorMessage = 'Invalid product data. Please check all fields and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleEditProduct = async () => {
    // Validate required fields
    if (!editForm.product_id) {
      setError('Product ID is required.');
      return;
    }
    if (!editForm.name.trim()) {
      setError('Product name is required.');
      return;
    }

    try {
      const response = await productAPI.editProduct(editForm);
      console.log('Product edited successfully:', response);
      
      // Reset form and close modal
      setEditForm({ product_id: '', name: '', size: 0, unit: '' });
      setEditProduct(null);
      setError('');
      setSuccess('Product updated successfully!');
      
      // Refresh products list
      await fetchProducts();
    } catch (err) {
      console.error('Failed to edit product:', err);
      
      let errorMessage = 'Failed to update product. Please try again.';
      
      if (err.message) {
        if (err.message.includes('DatabaseStoring')) {
          errorMessage = 'Database error: Unable to update product. Please check your data and try again.';
        } else if (err.message.includes('not found') || err.message.includes('does not exist')) {
          errorMessage = 'Product not found. It may have been deleted.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteProduct = async (qrCode) => {
    if (!qrCode) {
      setError('QR code is required for deletion.');
      return;
    }

    try {
      await productAPI.deleteProduct(qrCode);
      console.log('Product deleted successfully');
      
      // Close confirmation modal
      setDeleteConfirm(null);
      setError('');
      setSuccess('Product deleted successfully!');
      
      // Refresh products list
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      
      let errorMessage = 'Failed to delete product. Please try again.';
      
      if (err.message) {
        if (err.message.includes('DatabaseStoring')) {
          errorMessage = 'Database error: Unable to delete product. Please try again.';
        } else if (err.message.includes('not found') || err.message.includes('does not exist')) {
          errorMessage = 'Product not found. It may have already been deleted.';
        } else if (err.message.includes('in use') || err.message.includes('referenced')) {
          errorMessage = 'Cannot delete product: It is currently in use by existing stock or sales records.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleExportProducts = () => {
    const columns = getTableColumns('inventory');
    const exportData = products.map(product => ({
      ...product,
      name: product.name || 'Unknown Product',
      size: product.size || 'N/A',
      selling_price: new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF'
      }).format(product.selling_price || 0),
      stock_status: product.stock_status || 'Unknown'
    }));
    exportTableToPDF(exportData, columns, 'Product Inventory Report', `inventory-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const openEditModal = (product) => {
    setEditForm({
      product_id: product.product_id,
      name: product.name || '',
      size: product.size || 0,
      unit: product.unit || ''
    });
    setEditProduct(product);
  };

  const openDeleteConfirm = (product) => {
    setDeleteConfirm(product);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (query.trim()) {
      const search = query.trim().toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(search) ||
        product.product_id?.toLowerCase().includes(search) ||
        product.qr_code?.toLowerCase().includes(search) ||
        product.unit?.toLowerCase().includes(search)
      );
    }

    // Additional filters
    if (filterBy) {
      switch (filterBy) {
        case 'out_of_stock':
          filtered = filtered.filter(product => (product.stock || 0) === 0);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => 
            (product.stock || 0) > 0 && (product.stock || 0) <= statusSettings.lowStockThreshold
          );
          break;
        case 'in_stock':
          filtered = filtered.filter(product => (product.stock || 0) > statusSettings.lowStockThreshold);
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'stock':
          aValue = a.stock || 0;
          bValue = b.stock || 0;
          break;
        case 'price':
          aValue = parseFloat(a.selling_price) || 0;
          bValue = parseFloat(b.selling_price) || 0;
          break;
        case 'qr_code':
          aValue = (a.qr_code || '').toLowerCase();
          bValue = (b.qr_code || '').toLowerCase();
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [products, query, sortBy, sortOrder, filterBy, statusSettings.lowStockThreshold]);

  // Helper function to get status info with dynamic thresholds
  const getStatusInfo = (stock) => {
    if (stock === 0) {
      return { label: 'Out of Stock', colorClass: 'text-status-red', percent: 0 };
    } else if (stock <= statusSettings.lowStockThreshold) {
      return { 
        label: 'Low Stock', 
        colorClass: 'text-status-yellow', 
        percent: Math.min(100, Math.round((stock / statusSettings.inStockThreshold) * 100))
      };
    } else {
      return { 
        label: 'In Stock', 
        colorClass: 'text-status-green', 
        percent: Math.min(100, Math.round((stock / statusSettings.inStockThreshold) * 100))
      };
    }
  };

  if (loading) {
    return (
      <PageLayout mainId="inventory-management-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Products Management" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading products...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <NotificationToast message={error} type="error" onClose={() => setError('')} />
      <NotificationToast message={success} type="success" onClose={() => setSuccess('')} />
      <NotificationToast message={info} type="info" onClose={() => setInfo('')} />
      <PageLayout mainId="inventory-management-page" mainClassName="flex flex-col overflow-hidden">
      <Header
        title="Products Management"
        subtitle={`${products.length} products - ${products.reduce((sum, p) => sum + (p.stock || 0), 0)} items total`}
        right={
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportProducts}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-pdf" />
              <span>Export PDF</span>
            </button>
            <button 
              onClick={() => setShowStatusSettings(true)}
              className="px-4 py-2.5 bg-white border border-border-light text-text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <i className="fa-solid fa-cog mr-2" /> Status Settings
            </button>
            <button onClick={() => setCreateProduct(true)} className="px-5 py-2.5 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-600 transition-all transform hover:scale-105">
              Create
            </button>
          </div>
        }
      />

      {/* Filter and Sort Bar */}
      <div className="bg-card-bg p-4 rounded-xl shadow-sm border border-border-light mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products, QR codes, units..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Filter By</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
            >
              <option value="">All Products</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="in_stock">In Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="stock-desc">Stock (Highest)</option>
              <option value="stock-asc">Stock (Lowest)</option>
              <option value="price-desc">Price (Highest)</option>
              <option value="price-asc">Price (Lowest)</option>
              <option value="qr_code-asc">QR Code (A-Z)</option>
              <option value="qr_code-desc">QR Code (Z-A)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => {
                setQuery('');
                setFilterBy('');
                setSortBy('name');
                setSortOrder('asc');
              }}
              className="w-full px-3 py-2 bg-light-bg border border-border-light rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
            >
              <i className="fa-solid fa-eraser mr-2"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div id="product-table-container" className="flex-1 overflow-y-auto">
        <TableHeaderRow />
        <div id="product-list" className="space-y-3">
          {filteredAndSortedProducts.map((product) => {
            const statusInfo = getStatusInfo(product.stock);
            return (
            <ProductRow
                key={product.product_id}
                image={product.image_path || 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'}
                name={product.name}
                sku={product.product_id}
                statusLabel={statusInfo.label}
                statusColorClass={statusInfo.colorClass}
                statusPercent={statusInfo.percent}
                price={`${product.selling_price}`}
                onEdit={() => openEditModal(product)}
                onView={() => setViewProduct(product)}
                onDelete={() => openDeleteConfirm(product)}
            />
            );
          })}
        </div>
        
        {filteredAndSortedProducts.length === 0 && !loading && (
          <div className="text-center py-8 text-text-secondary">
            <i className="fa-solid fa-box-open text-4xl mb-4"></i>
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* View Product Modal */}
      <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)}>
        {viewProduct && (
          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img className="w-20 h-20 rounded-xl object-cover" src={viewProduct.image_path || 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'} alt={viewProduct.name} />
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{viewProduct.name}</h2>
                  <p className="text-text-secondary">ID: {viewProduct.product_id}</p>
                  <p className="text-xl font-semibold text-sky-600 mt-1">Rwf {viewProduct.selling_price || viewProduct.untaxed_price || 0}</p>
                </div>
              </div>
              <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="my-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-sky-50 p-4 rounded-lg">
                <p className="text-sm text-sky-500">Stock</p>
                <p className="text-2xl font-bold text-sky-800">{viewProduct.stock || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-500">Tax Rate</p>
                <p className="text-2xl font-bold text-green-800">{viewProduct.latest_tax || 0}%</p>
              </div>
            </div>

            <div id="modal-details" className="space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Product Details</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p>Untaxed Price: <span className="font-bold">Rwf {viewProduct.untaxed_price || 0}</span></p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setViewProduct(null);
                openEditModal(viewProduct);
              }}
              className="mt-6 w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-600 transition-all"
            >
              <i className="fa-solid fa-edit mr-2" /> Edit Product
            </button>
          </div>
        )}
      </Modal>

      {/* Create Product Modal */}
      <Modal isOpen={createProduct} onClose={() => setCreateProduct(false)}>
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
              <FormField
                id="new-product-size"
                label="Size"
                type="number"
                placeholder="Size"
                value={newProduct.size}
                onChange={(e) => setNewProduct({...newProduct, size: parseInt(e.target.value) || 0})}
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
            <FormField
              id="new-product-image"
              label="Product Image (Default)"
              placeholder="Using default product image"
              value={newProduct.image_path}
              onChange={(e) => setNewProduct({...newProduct, image_path: e.target.value})}
              inputProps={{ 
                className: 'w-full px-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-text-secondary',
                readOnly: true
              }}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <PrimaryButton onClick={handleCreateProduct} className="flex-1">
              Create Product
            </PrimaryButton>
            <SecondaryButton onClick={() => setCreateProduct(false)} className="flex-1">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Edit Product</h3>
          <div className="space-y-3">
            <FormField
              id="edit-product-id"
              label="Product ID"
              placeholder="Product ID"
              value={editForm.product_id}
              onChange={(e) => setEditForm({...editForm, product_id: e.target.value})}
              inputProps={{
                className: 'w-full px-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-text-secondary',
                readOnly: true
              }}
            />
            <FormField
              id="edit-product-name"
              label="Product Name"
              placeholder="Enter product name"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
            />
            <FormField
              id="edit-product-size"
              label="Size"
              type="number"
              placeholder="Size"
              value={editForm.size}
              onChange={(e) => setEditForm({...editForm, size: parseInt(e.target.value) || 0})}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Unit</label>
              <SelectField
                id="edit-product-unit"
                value={editForm.unit}
                onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                options={[
                  { value: 'g', label: 'Grams (g)' },
                  { value: 'ml', label: 'Milliliters (ml)' }
                ]}
                placeholder="Select unit..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <PrimaryButton onClick={handleEditProduct} className="flex-1">
              Update Product
            </PrimaryButton>
            <SecondaryButton onClick={() => setEditProduct(null)} className="flex-1">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Status Settings Modal */}
      <Modal isOpen={showStatusSettings} onClose={() => setShowStatusSettings(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Status Management Settings</h3>
          <div className="space-y-3">
            <FormField
              id="in-stock-threshold"
              label="In Stock Threshold"
              type="number"
              placeholder="e.g., 10"
              value={statusSettings.inStockThreshold}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                saveStatusSettings({
                  ...statusSettings,
                  inStockThreshold: value
                });
              }}
              inputProps={{
                className: 'w-full px-4 py-2 bg-white border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow'
              }}
            />
            <FormField
              id="low-stock-threshold"
              label="Low Stock Threshold"
              type="number"
              placeholder="e.g., 5"
              value={statusSettings.lowStockThreshold}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                saveStatusSettings({
                  ...statusSettings,
                  lowStockThreshold: value
                });
              }}
              inputProps={{
                className: 'w-full px-4 py-2 bg-white border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow'
              }}
            />
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Status Rules:</h4>
              <ul className="space-y-1">
                <li>• <span className="text-status-red font-medium">Out of Stock:</span> 0 items</li>
                <li>• <span className="text-status-yellow font-medium">Low Stock:</span> 1 - {statusSettings.lowStockThreshold} items</li>
                <li>• <span className="text-status-green font-medium">In Stock:</span> {statusSettings.lowStockThreshold + 1}+ items</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <SecondaryButton onClick={() => setShowStatusSettings(false)} className="flex-1">
              Close
            </SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Delete Product</h3>
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <SecondaryButton onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton 
              onClick={() => handleDeleteProduct(deleteConfirm?.qr_code)} 
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </PrimaryButton>
          </div>
        </div>
      </Modal>
      </PageLayout>
    </>
  );
} 