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
    if (!selectedStock || !formData.number) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      // Calculate the delta from original number
      const currentNumber = selectedStock.number || selectedStock.current_quantity || 0;
      const newNumber = parseInt(formData.number);
      const originalNumberDelta = newNumber - currentNumber;

      await stockAPI.editStock({
        stock_id: selectedStock.id,
        original_number_delta: originalNumberDelta,
        buying_price: formData.buying_price ? parseInt(formData.buying_price) : undefined,
        tax: formData.tax ? parseInt(formData.tax) : undefined,
        expiry_date: formData.expiry_date || undefined,
        manufacturer_batch_id: formData.manufacturer_batch_id || undefined
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
      await stockAPI.deleteStock(selectedStock.id);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-boxes-stacked text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Stock</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(stocks.length)}</p>
                <p className="text-xs text-blue-600 font-medium mt-2">Entries in system</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-orange-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-exclamation-triangle text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(stocks.filter(s => s.current_quantity <= 10).length)}</p>
                <p className="text-xs text-orange-600 font-medium mt-2">Needs restocking</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-red-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-calendar-times text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expired</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(stocks.filter(s => s.expiry_date && new Date(s.expiry_date) < new Date()).length)}</p>
                <p className="text-xs text-red-600 font-medium mt-2">Items expired</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Value</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatCurrency(stocks.reduce((sum, s) => sum + ((parseFloat(s.buying_price) || 0) * (parseInt(s.current_quantity) || 0)), 0))}</p>
                <p className="text-xs text-emerald-600 font-medium mt-2">Stock worth</p>
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
        <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <span className="col-span-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Product</span>
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Batch ID</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Qty</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Price</span>
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Expiry Date</span>
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supplier</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
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
                  <div key={stock.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                    {/* Product */}
                    <div className="col-span-3">
                      <p className="font-semibold text-gray-700">{stock.product_name || 'Unknown Product'}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {stock.product_id?.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-400">Added: {formatDate(stock.added_at)}</p>
                    </div>

                    {/* Batch ID */}
                    <div className="col-span-2">
                      <p className="font-mono text-sm text-gray-600">{stock.manufacturer_batch_id || 'N/A'}</p>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 text-center">
                      <span className={`font-semibold text-sm ${stockStatus.status === 'out-of-stock' ? 'text-rose-600' : stockStatus.status === 'low-stock' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatNumberWithCommas(stock.current_quantity || 0)}/{formatNumberWithCommas(stock.original_quantity || 0)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 text-right">
                      <p className="font-semibold text-gray-700">{formatCurrency(stock.buying_price)}</p>
                    </div>

                    {/* Expiry Date */}
                    <div className="col-span-2">
                      <p className={`text-sm font-medium ${expiryStatus.status === 'expired' ? 'text-rose-600' : expiryStatus.status === 'expiring-soon' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatDate(stock.expiry_date)}
                      </p>
                    </div>

                    {/* Supplier */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{stock.supplier_name || 'Unknown Supplier'}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(stock)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all hover:scale-105"
                        title="Edit Stock"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => openDeleteModal(stock)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:scale-105"
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
              <NumberField
                id="number"
                label="New Quantity"
                placeholder="Enter new quantity"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                required={true}
                min={0}
                step="1"
              />
              <NumberField
                id="buying_price"
                label="Buying Price (optional)"
                placeholder="Enter buying price"
                value={formData.buying_price}
                onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
                min={0}
                step="1"
              />
              <NumberField
                id="tax"
                label="Tax % (optional)"
                placeholder="0% (disabled)"
                value={formData.tax}
                onChange={(e) => setFormData({...formData, tax: 0})}
                min={0}
                disabled={true}
                max={100}
                step="1"
              />
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Batch ID (optional)</label>
                <input
                  type="text"
                  value={formData.manufacturer_batch_id}
                  onChange={(e) => setFormData({...formData, manufacturer_batch_id: e.target.value})}
                  placeholder="Enter manufacturer batch ID"
                  className="w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200"
                />
              </div>
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
