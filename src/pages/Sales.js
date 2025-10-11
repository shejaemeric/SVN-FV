import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import NotificationToast from '../components/ErrorToast';
import Modal from '../components/Modal';
import { salesAPI, handleAPIError } from '../services/api';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';
import { exportTableToPDF, getTableColumns } from '../utils/exportUtils';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [salesResponse] = await Promise.all([
        salesAPI.getAllSales()
      ]);
      
      setSales(Array.isArray(salesResponse) ? salesResponse : (salesResponse.data || salesResponse.sales || []));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort sales
  const filteredAndSortedSales = useMemo(() => {
    let filtered = sales;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.product_name?.toLowerCase().includes(search) ||
        sale.sale_id?.toLowerCase().includes(search)
      );
    }

    // Additional filters
    if (filterBy) {
      switch (filterBy) {
        case 'today':
          const today = new Date().toISOString().split('T')[0];
          filtered = filtered.filter(sale => 
            sale.created_at && sale.created_at.startsWith(today)
          );
          break;
        case 'this_week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(sale => 
            sale.created_at && new Date(sale.created_at) >= weekAgo
          );
          break;
        case 'this_month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(sale => 
            sale.created_at && new Date(sale.created_at) >= monthAgo
          );
          break;
        case 'high_value':
          filtered = filtered.filter(sale => 
            (sale.number || 0) * (sale.unit_price || 0) >= 10000
          );
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
          aValue = a.number || 0;
          bValue = b.number || 0;
          break;
        case 'unit_price':
          aValue = a.unit_price || 0;
          bValue = b.unit_price || 0;
          break;
        case 'total_value':
          aValue = (a.number || 0) * (a.unit_price || 0);
          bValue = (b.number || 0) * (b.unit_price || 0);
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [sales, searchTerm, sortBy, sortOrder, filterBy]);


  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    try {
      // Use 'id' field from FoundSale structure
      await salesAPI.deleteSale(selectedSale.id || selectedSale.sale_id);
      setShowDeleteModal(false);
      setSelectedSale(null);
      setError('');
      setSuccess('Sale deleted successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete sale:', err);
      setError(handleAPIError(err));
    }
  };


  const openDeleteModal = (sale) => {
    setSelectedSale(sale);
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

  const handleExportSales = () => {
    const columns = getTableColumns('sales');
    const exportData = sales.map(sale => ({
      ...sale,
      product_name: sale.product_name || 'Unknown Product',
      customer_name: sale.customer_name || 'Walk-in Customer',
      total_value: formatCurrency(calculateTotalValue(sale.number, sale.unit_price)),
      created_at: formatDate(sale.created_at)
    }));
    exportTableToPDF(exportData, columns, 'Sales Report', `sales-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const calculateTotalValue = (number, unitPrice) => {
    return (number || 0) * (unitPrice || 0);
  };

  if (loading) {
    return (
      <PageLayout mainId="sales-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Sales Management" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading sales data...</p>
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
      <PageLayout mainId="sales-page" mainClassName="flex flex-col overflow-hidden">
        <Header
          title="Sales Management"
          subtitle={`${filteredAndSortedSales.length} sales records`}
        right={
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportSales}
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
                  <i className="fa-solid fa-chart-line text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Sales</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(sales.length)}</p>
                <p className="text-xs text-blue-600 font-medium mt-2">Transactions</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatCurrency(sales.reduce((sum, s) => sum + calculateTotalValue(s.number, s.unit_price), 0))}</p>
                <p className="text-xs text-emerald-600 font-medium mt-2">Total earned</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-indigo-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-calendar-day text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Sales</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(sales.filter(s => s.created_at && s.created_at.startsWith(new Date().toISOString().split('T')[0])).length)}</p>
                <p className="text-xs text-indigo-600 font-medium mt-2">Sales today</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-purple-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -mr-12 -mt-12"></div>
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-calculator text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Sale Value</p>
              </div>
                <p className="text-3xl font-semibold text-gray-700">{formatCurrency(sales.length > 0 ? sales.reduce((sum, s) => sum + calculateTotalValue(s.number, s.unit_price), 0) / sales.length : 0)}</p>
                <p className="text-xs text-purple-600 font-medium mt-2">Per transaction</p>
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
                placeholder="Search products, customers, sale IDs..."
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
                <option value="">All Sales</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="high_value">High Value (≥RWF 10,000)</option>
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
                <option value="created_at-desc">Date (Newest)</option>
                <option value="created_at-asc">Date (Oldest)</option>
                <option value="product_name-asc">Product (A-Z)</option>
                <option value="product_name-desc">Product (Z-A)</option>
                <option value="total_value-desc">Value (Highest)</option>
                <option value="total_value-asc">Value (Lowest)</option>
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

        {/* Sales Table */}
        <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="grid grid-cols-10 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</span>
            <span className="col-span-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Product</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Qty</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Unit Price</span>
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Total Value</span>
            <span className="col-span-1 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedSales.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <i className="fa-solid fa-chart-line text-6xl mb-4 text-gray-300"></i>
                <p className="text-xl font-medium mb-2">No sales found</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredAndSortedSales.map((sale) => (
                <div key={sale.sale_id} className="grid grid-cols-10 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                  {/* Date */}
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-700">{formatDate(sale.created_at)}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {sale.sale_id?.substring(0, 8)}...</p>
                  </div>

                  {/* Product */}
                  <div className="col-span-3">
                    <p className="font-semibold text-gray-700">{sale.product_name || 'Unknown Product'}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {sale.product_id?.substring(0, 8)}...</p>
                    {sale.customer_name && (
                      <p className="text-xs text-gray-400">Customer: {sale.customer_name}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 text-center">
                    <span className="font-semibold text-sm text-gray-700">
                      {formatNumberWithCommas(sale.number || 0)}
                    </span>
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-1 text-right">
                    <p className="font-semibold text-gray-600">{formatCurrency(sale.unit_price)}</p>
                  </div>

                  {/* Total Value */}
                  <div className="col-span-2 text-right">
                    <p className="font-semibold text-lg text-emerald-700">{formatCurrency(calculateTotalValue(sale.number, sale.unit_price))}</p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => openDeleteModal(sale)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:scale-105"
                      title="Delete Sale"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Delete Sale</h3>
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
                Are you sure you want to delete this sale? This will permanently remove the sale from the system.
              </p>
            </div>

            {selectedSale && (
              <div className="bg-light-bg p-4 rounded-lg">
                <p className="font-medium text-text-primary">{selectedSale.product_name}</p>
                <p className="text-sm text-text-secondary">Quantity: {selectedSale.number}</p>
                <p className="text-sm text-text-secondary">Unit Price: {formatCurrency(selectedSale.unit_price)}</p>
                <p className="text-sm text-text-secondary">Total: {formatCurrency(calculateTotalValue(selectedSale.number, selectedSale.unit_price))}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowDeleteModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleDeleteSale} className="flex-1 bg-status-red hover:bg-status-red/90">
                <i className="fa-solid fa-trash mr-2"></i> Delete Sale
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}
