import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import NumberField from '../components/NumberField';
import SelectField from '../components/SelectField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import NotificationToast from '../components/ErrorToast';
import Modal from '../components/Modal';
import { stockAPI, productAPI, supplierAPI, handleAPIError } from '../services/api';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';
import { exportTableToPDF, getTableColumns } from '../utils/exportUtils';

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    buying_price: '',
    expiry_date: '',
    manufacturer_batch_id: '',
    number: '',
    tax: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [stocksResponse, productsResponse, suppliersResponse] = await Promise.all([
        stockAPI.getAllStocks(),
        productAPI.getAllProducts(),
        supplierAPI.getAllSuppliers()
      ]);
      
      const stocksData = Array.isArray(stocksResponse) ? stocksResponse : (stocksResponse.data || stocksResponse.stocks || []);
      const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse.data || productsResponse.products || []);
      const suppliersData = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse.data || suppliersResponse.suppliers || []);
      
      // Create lookup maps for enrichment
      const productMap = {};
      productsData.forEach(product => {
        // Handle different possible ID fields
        if (product.product_id) productMap[product.product_id] = product;
        if (product.id) productMap[product.id] = product;
        if (product.qr_code) productMap[product.qr_code] = product;
      });
      
      const supplierMap = {};
      suppliersData.forEach(supplier => {
        if (supplier.id) supplierMap[supplier.id] = supplier;
        if (supplier.supplier_id) supplierMap[supplier.supplier_id] = supplier;
      });
      
      // Enrich stocks with product and supplier information
      const enrichedStocks = stocksData.map(stock => {
        // Try multiple ways to find the product
        let product = productMap[stock.product_id] || 
                     productMap[stock.qr_code] || 
                     productMap[stock.product_qr_code];
        
        // If still not found, try to find by matching QR codes
        if (!product) {
          product = productsData.find(p => p.qr_code === stock.product_id || p.product_id === stock.product_id);
        }
        
        // Try multiple ways to find the supplier
        let supplier = supplierMap[stock.supplier_id];
        
        return {
          ...stock,
          product_name: product?.name || stock.product_name || 'Unknown Product',
          supplier_name: supplier?.name || supplier?.supplier_name || stock.supplier_name || 'Unknown Supplier',
          // Use the correct field names from API
          original_quantity: stock.original_number || 0,
          current_quantity: stock.current_number || 0,
          // Add added_at field if not present
          added_at: stock.added_at || stock.created_at || stock.date_added || new Date().toISOString()
        };
      });
      
      setStocks(enrichedStocks);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.product_name?.toLowerCase().includes(search) ||
        stock.manufacturer_batch_id?.toLowerCase().includes(search) ||
        stock.supplier_name?.toLowerCase().includes(search) ||
        stock.product_id?.toLowerCase().includes(search) ||
        stock.batch_id?.toLowerCase().includes(search)
      );
    }

    // Additional filters
    if (filterBy) {
      switch (filterBy) {
        case 'expired':
          filtered = filtered.filter(stock => 
            stock.expiry_date && new Date(stock.expiry_date) < new Date()
          );
          break;
        case 'expiring_soon':
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          filtered = filtered.filter(stock => 
            stock.expiry_date && 
            new Date(stock.expiry_date) <= thirtyDaysFromNow &&
            new Date(stock.expiry_date) > new Date()
          );
          break;
        case 'low_stock':
          filtered = filtered.filter(stock => stock.current_quantity <= 10);
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'product_name':
          aValue = a.product_name || '';
          bValue = b.product_name || '';
          break;
        case 'number':
          aValue = a.current_quantity || 0;
          bValue = b.current_quantity || 0;
          break;
        case 'buying_price':
          aValue = a.buying_price || 0;
          bValue = b.buying_price || 0;
          break;
        case 'expiry_date':
          aValue = new Date(a.expiry_date || '9999-12-31');
          bValue = new Date(b.expiry_date || '9999-12-31');
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || a.added_at || 0);
          bValue = new Date(b.created_at || b.added_at || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stocks, searchTerm, sortBy, sortOrder, filterBy]);


  const handleEditStock = async () => {
    if (!selectedStock || !formData.number || !formData.supplier_id) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await stockAPI.editBatch({
        batch_id: selectedStock.id,
        number: parseInt(formData.number)
      });
      
      setShowEditModal(false);
      setSelectedStock(null);
      setFormData({
        product_id: '',
        supplier_id: '',
        buying_price: '',
        expiry_date: '',
        manufacturer_batch_id: '',
        number: '',
        tax: ''
      });
      setError('');
      setSuccess('Stock updated successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to edit stock:', err);
      setError(handleAPIError(err));
    }
  };

  const handleDeleteStock = async () => {
    if (!selectedStock) return;

    try {
      await stockAPI.deleteBatch(selectedStock.id);
      setShowDeleteModal(false);
      setSelectedStock(null);
      setError('');
      setSuccess('Stock deleted successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete stock:', err);
      setError(handleAPIError(err));
    }
  };

  const openEditModal = (stock) => {
    setSelectedStock(stock);
    setFormData({
      product_id: stock.product_id || '',
      supplier_id: stock.supplier_id || '',
      buying_price: stock.buying_price || '',
      expiry_date: stock.expiry_date || '',
      manufacturer_batch_id: stock.manufacturer_batch_id || '',
      number: stock.current_quantity || '',
      tax: stock.tax || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (stock) => {
    setSelectedStock(stock);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = formatCurrencyWhole;

  const handleExportStocks = () => {
    const columns = getTableColumns('stocks');
    const exportData = stocks.map(stock => ({
      ...stock,
      product_name: stock.product_name || 'Unknown Product',
      supplier_name: stock.supplier_name || 'Unknown Supplier',
      current_quantity: `${stock.current_quantity}/${stock.original_quantity}`,
      buying_price: formatCurrency(stock.buying_price || 0),
      expiry_date: formatDate(stock.expiry_date)
    }));
    exportTableToPDF(exportData, columns, 'Stock Report', `stocks-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'no-date', color: 'text-gray-500' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'text-red-600' };
    if (daysUntilExpiry <= 30) return { status: 'expiring-soon', color: 'text-orange-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const getStockStatus = (number) => {
    if (number <= 0) return { status: 'out-of-stock', color: 'text-red-600' };
    if (number <= 10) return { status: 'low-stock', color: 'text-orange-600' };
    return { status: 'in-stock', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <PageLayout mainId="stocks-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Stock Management" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading stock data...</p>
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
      <PageLayout mainId="stocks-page" mainClassName="flex flex-col overflow-hidden">
        <Header
          title="Stock Management"
          subtitle={`${filteredAndSortedStocks.length} stock entries`}
          right={
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportStocks}
                className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-file-pdf" />
                <span>Export PDF</span>
              </button>
              <button 
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-border-light rounded-lg text-text-secondary hover:bg-light-bg hover:text-text-primary transition-colors shadow-sm"
              >
                <i className="fa-solid fa-refresh" />
                <span>Refresh</span>
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus" />
                <span>Add Stock</span>
              </button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-status-green to-status-green/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Stock Entries</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(stocks.length)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-boxes-stacked text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-status-yellow to-status-yellow/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Low Stock Items</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(stocks.filter(s => s.current_quantity <= 10).length)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-exclamation-triangle text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-status-red to-status-red/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Expired Items</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(stocks.filter(s => s.expiry_date && new Date(s.expiry_date) < new Date()).length)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-calendar-times text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-brand-blue to-brand-blue/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stocks.reduce((sum, s) => sum + ((parseFloat(s.buying_price) || 0) * (parseInt(s.current_quantity) || 0)), 0))}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-money-bill-wave text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card-bg p-4 rounded-xl shadow-sm border border-border-light mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
              <input
                type="text"
                placeholder="Search products, batch IDs, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <option value="">All Items</option>
                <option value="low_stock">Low Stock (≤10)</option>
                <option value="expiring_soon">Expiring Soon (≤30 days)</option>
                <option value="expired">Expired</option>
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
                <option value="created_at-desc">Date Added (Newest)</option>
                <option value="created_at-asc">Date Added (Oldest)</option>
                <option value="product_name-asc">Product Name (A-Z)</option>
                <option value="product_name-desc">Product Name (Z-A)</option>
                <option value="number-desc">Quantity (Highest)</option>
                <option value="number-asc">Quantity (Lowest)</option>
                <option value="expiry_date-asc">Expiry Date (Earliest)</option>
                <option value="expiry_date-desc">Expiry Date (Latest)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('');
                  setSortBy('created_at');
                  setSortOrder('desc');
                }}
                className="w-full px-3 py-2 bg-light-bg border border-border-light rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
              >
                <i className="fa-solid fa-eraser mr-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <section className="flex-1 flex flex-col bg-card-bg rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 border-b border-border-light">
            <span className="col-span-3 font-semibold text-text-secondary">Product</span>
            <span className="col-span-2 font-semibold text-text-secondary">Batch ID</span>
            <span className="col-span-1 font-semibold text-text-secondary text-center">Qty</span>
            <span className="col-span-1 font-semibold text-text-secondary text-right">Price</span>
            <span className="col-span-2 font-semibold text-text-secondary">Expiry Date</span>
            <span className="col-span-2 font-semibold text-text-secondary">Supplier</span>
            <span className="col-span-1 font-semibold text-text-secondary text-center">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedStocks.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <i className="fa-solid fa-boxes-stacked text-6xl mb-4 text-gray-300"></i>
                <p className="text-xl font-medium mb-2">No stock entries found</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredAndSortedStocks.map((stock) => {
                const expiryStatus = getExpiryStatus(stock.expiry_date);
                const stockStatus = getStockStatus(stock.current_quantity);
                
                return (
                  <div key={stock.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-border-light hover:bg-light-bg transition-colors">
                    {/* Product */}
                    <div className="col-span-3">
                      <p className="font-medium text-text-primary">{stock.product_name || 'Unknown Product'}</p>
                      <p className="text-sm text-text-secondary">ID: {stock.product_id?.substring(0, 8)}...</p>
                      <p className="text-xs text-text-secondary">Added: {formatDate(stock.added_at)}</p>
                    </div>

                    {/* Batch ID */}
                    <div className="col-span-2">
                      <p className="font-mono text-sm text-text-primary">{stock.manufacturer_batch_id || 'N/A'}</p>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 text-center">
                      <span className={`font-semibold ${stockStatus.color}`}>
                        {formatNumberWithCommas(stock.current_quantity || 0)}/{formatNumberWithCommas(stock.original_quantity || 0)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 text-right">
                      <p className="font-medium text-text-primary">{formatCurrency(stock.buying_price)}</p>
                    </div>

                    {/* Expiry Date */}
                    <div className="col-span-2">
                      <p className={`text-sm ${expiryStatus.color}`}>
                        {formatDate(stock.expiry_date)}
                      </p>
                    </div>

                    {/* Supplier */}
                    <div className="col-span-2">
                      <p className="text-sm text-text-primary">{stock.supplier_name || 'Unknown Supplier'}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(stock)}
                        className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                        title="Edit Stock"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => openDeleteModal(stock)}
                        className="p-2 text-status-red hover:bg-status-red/10 rounded-lg transition-colors"
                        title="Delete Stock"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Create Stock Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Add New Stock</h3>
                <p className="text-text-secondary">Create a new stock entry</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-4">
              <p className="text-brand-blue text-sm">
                <i className="fa-solid fa-info-circle mr-2"></i>
                Stock creation is handled through the Add Batch page. Please use that page to add new stock entries.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowCreateModal(false)} className="flex-1">
                Close
              </SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Edit Stock Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Edit Stock</h3>
                <p className="text-text-secondary">Update stock information</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <SelectField
                id="supplier_id"
                label="Supplier *"
                value={formData.supplier_id}
                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                options={suppliers.map(supplier => ({
                  value: supplier.id,
                  label: supplier.name || supplier.supplier_name || `Supplier ${supplier.id}`
                }))}
                placeholder="Select supplier"
              />
              <NumberField
                id="number"
                label="Quantity"
                placeholder="Enter quantity"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                required={true}
                min={1}
                step="1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleEditStock} className="flex-1">
                <i className="fa-solid fa-save mr-2"></i> Update Stock
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Delete Stock</h3>
                <p className="text-text-secondary">This action cannot be undone</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="bg-status-red/10 border border-status-red/20 rounded-lg p-4">
              <p className="text-status-red text-sm">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                Are you sure you want to delete this stock entry? This will permanently remove the stock from the system.
              </p>
            </div>

            {selectedStock && (
              <div className="bg-light-bg p-4 rounded-lg">
                <p className="font-medium text-text-primary">{selectedStock.product_name}</p>
                <p className="text-sm text-text-secondary">Quantity: {selectedStock.current_quantity}/{selectedStock.original_quantity}</p>
                <p className="text-sm text-text-secondary">Batch ID: {selectedStock.manufacturer_batch_id}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowDeleteModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleDeleteStock} className="flex-1 bg-status-red hover:bg-status-red/90">
                <i className="fa-solid fa-trash mr-2"></i> Delete Stock
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}
