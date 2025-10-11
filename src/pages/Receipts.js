import { useMemo, useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import ProductListItem from '../components/ProductListItem';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ErrorToast from '../components/ErrorToast';
import { receiptAPI, productAPI, customerAPI } from '../services/api';
import { downloadReceiptPDF, printReceipt, downloadReceiptsSummaryPDF, downloadReceiptsCSV } from '../utils/receiptUtils';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [editCartItems, setEditCartItems] = useState([]);
  const [editSelectedCustomer, setEditSelectedCustomer] = useState('');
  const [editNotPaidFull, setEditNotPaidFull] = useState(false);
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [editProcessing, setEditProcessing] = useState(false);

  // Load receipts, products, and customers on component mount
  useEffect(() => {
    fetchReceipts();
    fetchProducts();
    fetchCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductDropdown && !event.target.closest('.product-filter-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await receiptAPI.getAllReceipts();
      console.log('Receipts response:', response);
      const receiptsData = Array.isArray(response) ? response : (response.data || response.receipts || []);
      setReceipts(receiptsData);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
      setError('Failed to load receipts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAllProducts();
      console.log('Products fetched:', response);
      const productsData = Array.isArray(response) ? response : (response.data || response.products || []);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      // Don't show error for products as it's not critical for receipts view
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAllCustomers();
      console.log('Customers fetched:', response);
      const customersData = Array.isArray(response) ? response : (response.data || response.customers || []);
      setCustomers(customersData);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      // Don't show error for customers as it's not critical for receipts view
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format currency in Rwandan Francs
  const formatCurrency = formatCurrencyWhole;

  // Transform API data to match component expectations
  const transformedReceipts = useMemo(() => {
    return receipts.map(receipt => {
      // Calculate proper totals from sales data
      const sales = receipt.sales || [];
      const subtotal = sales.reduce((sum, sale) => sum + ((sale.number || 0) * (sale.unit_price || 0)), 0);
      const taxRate = 0; // 0% tax rate
      const taxes = Math.round(subtotal * taxRate);
      const total = subtotal + taxes;
      
      return {
        id: receipt.id,
        date: formatDate(receipt.created_at || new Date()),
        time: formatTime(receipt.created_at || new Date()),
        invoice: receipt.id,
        total: `RWF ${total.toFixed(0)}`,
        totalValue: total,
        items: sales.map(sale => ({
          name: sale.product_name || 'Product',
          qty: sale.number || 0,
          unitPrice: sale.unit_price || 0,
          unit: `RWF ${(sale.unit_price || 0).toFixed(0)}`,
          total: `RWF ${((sale.number || 0) * (sale.unit_price || 0)).toFixed(0)}`
        })),
        customer_id: receipt.customer_id,
        unpaid: receipt.unpaid || 0,
        subtotal: subtotal,
        taxes: taxes,
        amountPaid: receipt.amount_paid || total,
        remaining: receipt.remaining || 0,
        notPaidFull: receipt.unpaid > 0,
        customer: receipt.customer || null
      };
    });
  }, [receipts]);

  // Filter and sort receipts
  const filteredAndSorted = useMemo(() => {
    let filtered = transformedReceipts;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((r) =>
        r.invoice.toLowerCase().includes(search) ||
        r.items.some((it) => it.name.toLowerCase().includes(search))
      );
    }

    // Product filter
    if (productFilter) {
      const pf = productFilter.toLowerCase();
      filtered = filtered.filter((r) =>
        r.items.some((it) => it.name.toLowerCase().includes(pf))
      );
    }


    // Date range filter
    if (dateRange) {
      const today = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter((r) => {
        const receiptDate = new Date(r.date);
        return receiptDate >= cutoffDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'total':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'invoice':
          aValue = a.invoice;
          bValue = b.invoice;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transformedReceipts, searchTerm, productFilter, dateRange, sortBy, sortOrder]);

  // Get all unique products from receipts
  const allProducts = useMemo(() => {
    const productSet = new Set();
    transformedReceipts.forEach(receipt => {
      receipt.items.forEach(item => {
        productSet.add(item.name);
      });
    });
    return Array.from(productSet).sort();
  }, [transformedReceipts]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return allProducts;
    return allProducts.filter(product => 
      product.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [allProducts, productSearchTerm]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSales = filteredAndSorted.reduce((sum, r) => sum + r.totalValue, 0);
    const totalTransactions = filteredAndSorted.length;
    const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const cashSales = filteredAndSorted.filter(r => !r.customer_id).reduce((sum, r) => sum + r.totalValue, 0);
    const customerSales = filteredAndSorted.filter(r => r.customer_id).reduce((sum, r) => sum + r.totalValue, 0);

    return {
      totalSales: formatCurrency(totalSales),
      totalTransactions: formatNumberWithCommas(totalTransactions),
      averageOrder: formatCurrency(averageOrder),
      cashSales: formatCurrency(cashSales),
      customerSales: formatCurrency(customerSales)
    };
  }, [filteredAndSorted, formatCurrency]);


  const viewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = (receipt) => {
    try {
      const result = printReceipt(receipt);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error('Print error:', err);
      setError('Failed to print receipt. Please try again.');
    }
  };

  const handleDownloadReceipt = (receipt) => {
    try {
      const result = downloadReceiptPDF(receipt);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download receipt. Please try again.');
    }
  };

  const handleExportAllReceiptsPDF = () => {
    try {
      const result = downloadReceiptsSummaryPDF(filteredAndSorted, summaryStats);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export receipts. Please try again.');
    }
  };

  const handleExportAllReceiptsCSV = () => {
    try {
      const result = downloadReceiptsCSV(filteredAndSorted, summaryStats);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error('CSV export error:', err);
      setError('Failed to export CSV. Please try again.');
    }
  };

  const handleProductSelect = (productName) => {
    setProductFilter(productName);
    setProductSearchTerm(productName);
    setShowProductDropdown(false);
  };

  const handleProductSearchChange = (e) => {
    const value = e.target.value;
    setProductSearchTerm(value);
    setShowProductDropdown(true);
    
    // If user clears the search, also clear the filter
    if (!value) {
      setProductFilter('');
    }
  };

  const clearProductFilter = () => {
    setProductFilter('');
    setProductSearchTerm('');
    setShowProductDropdown(false);
  };

  // Edit receipt functionality
  const editReceipt = (receipt) => {
    setEditingReceipt(receipt);
    
    // Convert receipt items to cart format
    const cartItems = receipt.items.map(item => {
      const product = products.find(p => p.name === item.name);
      return {
        product_id: product?.product_id || 'unknown',
        name: item.name,
        unitPrice: item.unitPrice || 0, // unitPrice is already a number
        quantity: item.qty || 0,
        image: product?.image_path || DEFAULT_PRODUCT_IMAGE
      };
    });
    
    setEditCartItems(cartItems);
    setEditSelectedCustomer(receipt.customer_id || '');
    setEditNotPaidFull(receipt.notPaidFull || false);
    setEditAmountPaid(receipt.amountPaid || 0);
    setShowEditModal(true);
  };

  // Calculate edit totals
  const editSubtotal = useMemo(
    () => editCartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    [editCartItems]
  );
  
  const editTotal = useMemo(() => editSubtotal, [editSubtotal]);
  
  const editRemainingAmount = useMemo(() => {
    if (!editNotPaidFull) return 0;
    return Math.max(0, editTotal - editAmountPaid);
  }, [editNotPaidFull, editTotal, editAmountPaid]);

  // Update edit cart item quantity
  const updateEditQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeEditItem(productId);
    } else {
      setEditCartItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // Remove item from edit cart
  const removeEditItem = (productId) => {
    setEditCartItems(prev => prev.filter(item => item.product_id !== productId));
  };

  // Add product to edit cart
  const addToEditCart = (product) => {
    const existingItem = editCartItems.find(item => item.product_id === product.product_id);
    
    if (existingItem) {
      setEditCartItems(prev => prev.map(item => 
        item.product_id === product.product_id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem = {
        product_id: product.product_id,
        name: product.name,
        unitPrice: product.selling_price || product.untaxed_price || 0,
        quantity: 1,
        image: product.image_path || DEFAULT_PRODUCT_IMAGE
      };
      setEditCartItems(prev => [...prev, newItem]);
    }
  };

  // Delete receipt
  const handleDeleteReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      await receiptAPI.deleteReceipt(selectedReceipt.id);
      setShowDeleteModal(false);
      setSelectedReceipt(null);
      setError('');
      await fetchReceipts();
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      setError('Failed to delete receipt. Please try again.');
    }
  };

  const openDeleteModal = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDeleteModal(true);
  };

  // Save edited receipt
  const saveEditedReceipt = async () => {
    if (editCartItems.length === 0) {
      setError("Cart is empty. Please add items before saving.");
      return;
    }

    if (editNotPaidFull && editAmountPaid <= 0) {
      setError("Please enter the amount paid.");
      return;
    }

    if (editNotPaidFull && editAmountPaid > editTotal) {
      setError("Amount paid cannot be greater than total amount.");
      return;
    }

    if (editNotPaidFull && !editSelectedCustomer) {
      setError("Please select a customer for partial payment.");
      return;
    }
    
    setEditProcessing(true);
    setError("");

    try {
      console.log("Starting receipt edit for", editCartItems.length, "items");
      
      // Prepare sale creators for the receipt
      const saleCreators = editCartItems.map(item => {
        const product = products.find(p => p.product_id === item.product_id);
        return {
          number: item.quantity,
          qr_code: product?.qr_code || "2510" // Use actual QR code from product
        };
      });

      // Create receipt data with conditional fields based on payment status
      const receiptData = {
        receipt_id: editingReceipt.id,
        sale_creators: saleCreators,
        ...(editNotPaidFull && editSelectedCustomer && {
          customer_id: editSelectedCustomer,
          unpaid: Math.round(editRemainingAmount)
        })
      };

      console.log("Editing receipt with data:", receiptData);
      const receiptResponse = await receiptAPI.editReceipt(receiptData);

      console.log("Receipt edited successfully:", receiptResponse);

      // Refresh receipts list
      await fetchReceipts();

      // Close edit modal
      setShowEditModal(false);
      setEditingReceipt(null);
      setEditCartItems([]);
      setEditSelectedCustomer('');
      setEditNotPaidFull(false);
      setEditAmountPaid(0);

    } catch (err) {
      console.error("Failed to edit receipt:", err);
      setError('Unable to edit receipt. Please try again.');
    } finally {
      setEditProcessing(false);
    }
  };

  if (loading) {
    return (
      <PageLayout mainId="sales-history-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Sales History" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading receipts...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <ErrorToast error={error} onClose={() => setError('')} />
      <PageLayout mainId="sales-history-page" mainClassName="flex flex-col overflow-hidden">
      <Header
        title="Reciepts History"
        subtitle={`${summaryStats.totalTransactions} transactions - ${summaryStats.totalSales} total sales`}
        right={
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchReceipts}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm"
            >
              <i className="fa-solid fa-refresh" />
              <span>Refresh</span>
            </button>
            <button 
              onClick={handleExportAllReceiptsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-csv text-green-600" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={handleExportAllReceiptsPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-pdf text-red-600" />
              <span>Export PDF</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <i className="fa-solid fa-exclamation-triangle mr-2"></i>
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-chart-line text-white text-xl"></i>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Sales</p>
            </div>
            <p className="text-3xl font-semibold text-gray-700">{summaryStats.totalSales}</p>
            <p className="text-xs text-emerald-600 font-medium mt-2">Revenue earned</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-receipt text-white text-xl"></i>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transactions</p>
            </div>
            <p className="text-3xl font-semibold text-gray-700">{summaryStats.totalTransactions}</p>
            <p className="text-xs text-blue-600 font-medium mt-2">Receipts issued</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-purple-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-calculator text-white text-xl"></i>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Average Order</p>
            </div>
            <p className="text-3xl font-semibold text-gray-700">{summaryStats.averageOrder}</p>
            <p className="text-xs text-purple-600 font-medium mt-2">Per receipt</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-indigo-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-full -mr-12 -mt-12"></div>
          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash Sales</p>
            </div>
            <p className="text-3xl font-semibold text-gray-700">{summaryStats.cashSales}</p>
            <p className="text-xs text-indigo-600 font-medium mt-2">Paid in full</p>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-border-light mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
            <input
              type="text"
              placeholder="Search receipts, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Time</option>
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="relative product-filter-container">
            <label className="block text-sm font-medium text-text-primary mb-2">Product</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search and select product..."
                value={productSearchTerm}
                onChange={handleProductSearchChange}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {productFilter && (
                <button
                  onClick={clearProductFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear filter"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              )}
            </div>
            
            {/* Product Dropdown */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product}
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
            
            {/* Selected Product Display */}
{/*             {productFilter && (
              <div className="mt-2 px-2 py-1 bg-sky-100 text-sky-800 rounded text-sm">
                <i className="fa-solid fa-filter mr-1"></i>
                Filtered by: {productFilter}
              </div>
            )} */}
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="total-desc">Amount (Highest)</option>
              <option value="total-asc">Amount (Lowest)</option>
              <option value="invoice-desc">Receipt ID (Z-A)</option>
              <option value="invoice-asc">Receipt ID (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Sales Table */}
      <section id="sales-table-container" className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div id="sales-table-header" className="grid grid-cols-10 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
          <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date & Time</span>
          <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Receipt ID</span>
          <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Total Amount</span>
          <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Items</span>
          <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
        </div>
        <div id="sales-table-body" className="flex-1 overflow-y-auto">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <i className="fa-solid fa-receipt text-6xl mb-4 text-gray-300"></i>
              <p className="text-xl font-medium mb-2">No receipts found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredAndSorted.map((receipt) => (
              <div key={receipt.id} className="grid grid-cols-10 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                {/* Date & Time */}
                <div className="col-span-2">
                  <p className="font-semibold text-gray-700">{receipt.date}</p>
                  <p className="text-xs text-gray-500">{receipt.time}</p>
                </div>

                {/* Receipt ID */}
                <div className="col-span-2">
                  <p 
                    className="font-mono text-gray-600 font-semibold cursor-help" 
                    title={`Full ID: ${receipt.invoice}`}
                  >
                    #{receipt.invoice.substring(0, 8)}...
                  </p>
                </div>

                {/* Total Amount */}
                <div className="col-span-2 text-right">
                  <p className="font-semibold text-lg text-emerald-700">{receipt.total}</p>
                </div>

                {/* Items */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 font-medium">
                    {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {receipt.items.slice(0, 2).map(item => item.name).join(', ')}
                    {receipt.items.length > 2 && '...'}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => viewReceipt(receipt)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all hover:scale-105"
                    title="View Details"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button
                    onClick={() => editReceipt(receipt)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hover:scale-105"
                    title="Edit Receipt"
                  >
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handlePrintReceipt(receipt)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
                    title="Print Receipt"
                  >
                    <i className="fa-solid fa-print"></i>
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(receipt)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all hover:scale-105"
                    title="Download PDF"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                  <button
                    onClick={() => openDeleteModal(receipt)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:scale-105"
                    title="Delete Receipt"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Enhanced Receipt Detail Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)}>
        {selectedReceipt && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Receipt Details</h3>
                <p className="text-text-secondary">Receipt ID: #{selectedReceipt.invoice}</p>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            {/* Receipt Info */}
            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-6 rounded-xl">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-text-secondary text-sm">Date</p>
                  <p className="font-semibold text-lg">{selectedReceipt.date}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Time</p>
                  <p className="font-semibold text-lg">{selectedReceipt.time}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Customer</p>
                  <span className="font-semibold">{selectedReceipt.customer_id ? 'Customer Order' : 'Cash Sale'}</span>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Items Count</p>
                  <span className="font-semibold">{selectedReceipt.items.length} item{selectedReceipt.items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">Items Purchased</h4>
              <div className="space-y-3">
                {selectedReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{item.name}</p>
                      <p className="text-sm text-text-secondary">
                        {item.qty} x {item.unit}
                      </p>
                    </div>
                    <p className="font-semibold text-text-primary">{item.total}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
{/*                 <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.subtotal || 0)}</span>
                </div> */}
{/*                 <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Tax (18%)</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.taxes || 0)}</span>
                </div> */}
                <div className="border-t border-border-light pt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-sky-600">{selectedReceipt.total}</span>
                  </div>
                </div>
                {selectedReceipt.notPaidFull && (
                  <>
                    <div className="flex justify-between items-center text-orange-600">
                      <span>Amount Paid</span>
                      <span className="font-medium">{formatCurrency(selectedReceipt.amountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600">
                      <span>Remaining</span>
                      <span className="font-medium">{formatCurrency(selectedReceipt.remaining || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowReceiptModal(false)} className="flex-1">
                Close
              </SecondaryButton>
              <PrimaryButton onClick={() => handlePrintReceipt(selectedReceipt)} className="flex-1">
                <i className="fa-solid fa-print mr-2"></i> Print Receipt
              </PrimaryButton>
              <PrimaryButton onClick={() => handleDownloadReceipt(selectedReceipt)} className="flex-1">
                <i className="fa-solid fa-download mr-2"></i> Download PDF
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Receipt Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {editingReceipt && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Edit Receipt</h3>
                <p className="text-sm text-text-secondary">Receipt #{editingReceipt.invoice}</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            {/* Products Section */}
            <div className="bg-white rounded-lg border border-border-light">
              <div className="p-4 border-b border-border-light">
                <h4 className="font-semibold text-text-primary">Products</h4>
              </div>
              
              {/* Add Product */}
              <div className="p-4 border-b border-border-light">
                <SelectField
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const product = products.find(p => p.product_id === e.target.value);
                      if (product) {
                        addToEditCart(product);
                      }
                    }
                  }}
                  options={[
                    { value: '', label: 'Add a product...' },
                    ...products.map(product => ({
                      value: product.product_id,
                      label: `${product.name} - RWF ${product.selling_price}`
                    }))
                  ]}
                  searchable={true}
                  searchPlaceholder="Search products..."
                  className="w-full"
                />
              </div>

              {/* Cart Items */}
              <div className="max-h-64 overflow-y-auto">
                {editCartItems.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    <i className="fa-solid fa-shopping-cart text-3xl mb-2 text-gray-300"></i>
                    <p>No items</p>
                  </div>
                ) : (
                  editCartItems.map((item) => (
                    <ProductListItem
                      key={item.product_id}
                      image={item.image}
                      name={item.name}
                      sku={item.product_id}
                      quantity={item.quantity}
                      unitPrice={item.unitPrice}
                      onQuantityChange={(newQuantity) => updateEditQuantity(item.product_id, newQuantity)}
                      onRemove={() => removeEditItem(item.product_id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg border border-border-light p-4">
              <h4 className="font-semibold text-text-primary mb-4">Payment Details</h4>
              
              <div className="space-y-4">
                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Customer</label>
                  <SelectField
                    value={editSelectedCustomer}
                    onChange={(e) => setEditSelectedCustomer(e.target.value)}
                    options={[
                      { value: '', label: 'No Customer' },
                      ...customers.map(customer => ({
                        value: customer.customer_id || customer.id,
                        label: `${customer.name}`
                      }))
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Partial Payment */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={editNotPaidFull}
                      onChange={(e) => setEditNotPaidFull(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-text-primary">Partial Payment</span>
                  </label>

                  {editNotPaidFull && (
                    <FormField
                      label="Amount Paid (RWF)"
                      type="number"
                      value={editAmountPaid}
                      onChange={(e) => setEditAmountPaid(parseFloat(e.target.value) || null)}
                      placeholder="Enter amount paid"
                    />
                  )}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal</span>
                      <span className="font-medium">{formatCurrency(editSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="text-green-600">{formatCurrency(editTotal)}</span>
                    </div>
                    {editNotPaidFull && (
                      <>
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Amount Paid</span>
                          <span className="font-medium">{formatCurrency(editAmountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Remaining</span>
                          <span className="font-medium">{formatCurrency(editRemainingAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <SecondaryButton onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton 
                onClick={saveEditedReceipt} 
                disabled={editProcessing || editCartItems.length === 0}
                className="flex-1"
              >
                {editProcessing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save mr-2"></i>
                    Save Changes
                  </>
                )}
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Receipt Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-6 max-w-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-text-primary">Delete Receipt</h3>
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
              Are you sure you want to delete this receipt? This will permanently remove the receipt and all associated sales from the system.
            </p>
          </div>

          {selectedReceipt && (
            <div className="bg-light-bg p-4 rounded-lg">
              <p className="font-medium text-text-primary">Receipt #{selectedReceipt.invoice}</p>
              <p className="text-sm text-text-secondary">Date: {selectedReceipt.date} {selectedReceipt.time}</p>
              <p className="text-sm text-text-secondary">Total: {selectedReceipt.total}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <SecondaryButton onClick={() => setShowDeleteModal(false)} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleDeleteReceipt} className="flex-1 bg-status-red hover:bg-status-red/90">
              <i className="fa-solid fa-trash mr-2"></i> Delete Receipt
            </PrimaryButton>
          </div>
        </div>
      </Modal>
      </PageLayout>
    </>
  );
}
