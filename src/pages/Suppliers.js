import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import FormField from '../components/FormField';
import NumberField from '../components/NumberField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import NotificationToast from '../components/ErrorToast';
import Modal from '../components/Modal';
import { supplierAPI, handleAPIError } from '../services/api';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';
import { exportTableToPDF, getTableColumns } from '../utils/exportUtils';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('suppliers');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    address: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    supplier_id: '',
    amount: ''
  });
  
  const [editPaymentData, setEditPaymentData] = useState({
    payment_id: '',
    supplier_id: '',
    amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [suppliersResponse, paymentsResponse] = await Promise.all([
        supplierAPI.getAllSuppliers(),
        supplierAPI.getAllSupplierPayments()
      ]);
      
      const suppliersData = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse.data || suppliersResponse.suppliers || []);
      const paymentsData = Array.isArray(paymentsResponse) ? paymentsResponse : (paymentsResponse.data || paymentsResponse.payments || []);
      
      // Enrich payments with supplier names
      const enrichedPayments = paymentsData.map(payment => {
        const supplier = suppliersData.find(s => s.id === payment.supplier_id);
        return {
          ...payment,
          supplier_name: supplier?.name || 'Unknown Supplier',
          payment_date: payment.created_at || payment.payment_date // Use created_at as payment_date
        };
      });
      
      setSuppliers(suppliersData);
      setPayments(enrichedPayments);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => 
        supplier.name?.toLowerCase().includes(search) ||
        supplier.contact_info?.toLowerCase().includes(search) ||
        supplier.address?.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'contact_info':
          aValue = a.contact_info || '';
          bValue = b.contact_info || '';
          break;
        case 'address':
          aValue = a.address || '';
          bValue = b.address || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [suppliers, searchTerm, sortBy, sortOrder]);

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.supplier_name?.toLowerCase().includes(search) ||
        payment.amount?.toString().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'supplier_name':
          aValue = a.supplier_name || '';
          bValue = b.supplier_name || '';
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'payment_date':
          aValue = new Date(a.payment_date || 0);
          bValue = new Date(b.payment_date || 0);
          break;
        default:
          aValue = new Date(a.payment_date || 0);
          bValue = new Date(b.payment_date || 0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [payments, searchTerm, sortBy, sortOrder]);

  const handleCreateSupplier = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a supplier name.');
      return;
    }

    try {
      // API expects plain string for supplier name
      await supplierAPI.createSupplier(formData.name.trim());
      setShowCreateModal(false);
      setFormData({ name: '', contact_info: '', address: '' });
      setError('');
      setSuccess('Supplier created successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to create supplier:', err);
      setError(handleAPIError(err));
    }
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier || !formData.name.trim()) {
      setError('Please enter a supplier name.');
      return;
    }

    try {
      await supplierAPI.editSupplier({
        supplier_id: selectedSupplier.supplier_id,
        ...formData
      });
      setShowEditModal(false);
      setSelectedSupplier(null);
      setFormData({ name: '', contact_info: '', address: '' });
      setError('');
      setSuccess('Supplier updated successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to edit supplier:', err);
      setError(handleAPIError(err));
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      await supplierAPI.deleteSupplier(selectedSupplier.supplier_id);
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      setError('');
      setSuccess('Supplier deleted successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      setError(handleAPIError(err));
    }
  };

  const handleMakePayment = async () => {
    if (!paymentData.supplier_id || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setError('Please select a supplier and enter a valid payment amount.');
      return;
    }

    try {
      await supplierAPI.paySupplier({
        id: paymentData.supplier_id,
        amount: parseInt(paymentData.amount)
      });
      setShowPaymentModal(false);
      setPaymentData({ supplier_id: '', amount: '' });
      setError('');
      setSuccess('Payment made successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to make payment:', err);
      setError(handleAPIError(err));
    }
  };

  const handleEditPayment = async () => {
    if (!editPaymentData.payment_id || !editPaymentData.supplier_id || !editPaymentData.amount) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await supplierAPI.editSupplierPayment({
        payment_id: editPaymentData.payment_id,
        supplier_id: editPaymentData.supplier_id,
        amount: parseInt(editPaymentData.amount)
      });
      
      setShowEditPaymentModal(false);
      setEditPaymentData({
        payment_id: '',
        supplier_id: '',
        amount: ''
      });
      setSelectedPayment(null);
      setError('');
      setSuccess('Payment updated successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to edit payment:', err);
      setError(handleAPIError(err));
    }
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact_info: supplier.contact_info || '',
      address: supplier.address || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const openPaymentModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setPaymentData({
      supplier_id: supplier?.supplier_id || supplier?.id || '',
      amount: ''
    });
    setShowPaymentModal(true);
  };

  const openViewPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
  };

  const openEditPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setEditPaymentData({
      payment_id: payment.payment_id || payment.id,
      supplier_id: payment.supplier_id,
      amount: payment.amount?.toString() || ''
    });
    setShowEditPaymentModal(true);
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

  const handleExportSuppliers = () => {
    const columns = getTableColumns('suppliers');
    const exportData = suppliers.map(supplier => {
      // Try different possible field names for debt
      const debt = parseFloat(supplier.total_owed) || parseFloat(supplier.debt) || parseFloat(supplier.outstanding_amount) || parseFloat(supplier.balance) || 0;
      return {
        ...supplier,
        total_owed: formatCurrency(debt)
      };
    });
    exportTableToPDF(exportData, columns, 'Suppliers Report', `suppliers-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportPayments = () => {
    const columns = [
      { key: 'supplier_name', header: 'Supplier Name', width: 40 },
      { key: 'amount', header: 'Amount', width: 25, align: 'right' },
      { key: 'payment_date', header: 'Payment Date', width: 35 }
    ];
    const exportData = payments.map(payment => ({
      ...payment,
      amount: formatCurrency(payment.amount || 0),
      payment_date: formatDate(payment.payment_date)
    }));
    exportTableToPDF(exportData, columns, 'Supplier Payments Report', `supplier-payments-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <PageLayout mainId="suppliers-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Supplier Management" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading supplier data...</p>
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
      <PageLayout mainId="suppliers-page" mainClassName="flex flex-col overflow-hidden">
        <Header
          title="Supplier Management"
          subtitle={`${suppliers.length} suppliers, ${payments.length} payments`}
          right={
            <div className="flex items-center gap-3">
              <button 
                onClick={activeTab === 'suppliers' ? handleExportSuppliers : handleExportPayments}
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
                <span>Add Supplier</span>
              </button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-14 -mt-14"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-truck text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Suppliers</p>
              </div>
              <p className="text-3xl font-semibold text-gray-700">{formatNumberWithCommas(suppliers.length)}</p>
              <p className="text-xs text-blue-600 font-medium mt-2">Active partnerships</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-red-100">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-full -mr-14 -mt-14"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-exclamation-triangle text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Debt</p>
              </div>
              <p className="text-3xl font-semibold text-gray-700">{formatCurrency(suppliers.reduce((sum, s) => {
                const debt = parseFloat(s.total_owed) || parseFloat(s.debt) || parseFloat(s.outstanding_amount) || parseFloat(s.balance) || 0;
                return sum + debt;
              }, 0))}</p>
              <p className="text-xs text-red-600 font-medium mt-2">Owed to suppliers</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-14 -mt-14"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Paid</p>
              </div>
              <p className="text-3xl font-semibold text-gray-700">{formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
              <p className="text-xs text-emerald-600 font-medium mt-2">Payments made</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card-bg rounded-xl shadow-sm border border-border-light mb-6">
          <div className="flex border-b border-border-light">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-truck mr-2"></i>
              Suppliers ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-money-bill-wave mr-2"></i>
              Payments ({payments.length})
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border-b border-border-light">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
                <input
                  type="text"
                  placeholder={activeTab === 'suppliers' ? 'Search suppliers...' : 'Search payments...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
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
                  {activeTab === 'suppliers' ? (
                    <>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="contact_info-asc">Contact (A-Z)</option>
                      <option value="contact_info-desc">Contact (Z-A)</option>
                    </>
                  ) : (
                    <>
                      <option value="payment_date-desc">Date (Newest)</option>
                      <option value="payment_date-asc">Date (Oldest)</option>
                      <option value="supplier_name-asc">Supplier (A-Z)</option>
                      <option value="supplier_name-desc">Supplier (Z-A)</option>
                      <option value="amount-desc">Amount (Highest)</option>
                      <option value="amount-asc">Amount (Lowest)</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy(activeTab === 'suppliers' ? 'name' : 'payment_date');
                    setSortOrder(activeTab === 'suppliers' ? 'asc' : 'desc');
                  }}
                  className="w-full px-3 py-2 bg-light-bg border border-border-light rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
                >
                  <i className="fa-solid fa-eraser mr-2"></i>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <span className="col-span-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</span>
              <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Total Paid</span>
              <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Debt</span>
              <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</span>
              <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredAndSortedSuppliers.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <i className="fa-solid fa-truck text-6xl mb-4 text-gray-300"></i>
                  <p className="text-xl font-medium mb-2">No suppliers found</p>
                  <p className="text-sm">Try adjusting your filters or add a new supplier</p>
                </div>
              ) : (
                filteredAndSortedSuppliers.map((supplier) => {
                  const supplierPayments = payments.filter(p => p.supplier_id === supplier.supplier_id);
                  const totalPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  // Try different possible field names for debt
                  const debt = parseFloat(supplier.total_owed) || parseFloat(supplier.debt) || parseFloat(supplier.outstanding_amount) || parseFloat(supplier.balance) || 0;
                  
                  return (
                    <div key={supplier.supplier_id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                      {/* Name */}
                      <div className="col-span-4">
                        <p className="font-semibold text-gray-700">{supplier.name}</p>
                        <p className="text-xs text-gray-500 font-mono">ID: {supplier.supplier_id?.substring(0, 8)}...</p>
                      </div>

                      {/* Total Paid */}
                      <div className="col-span-2 text-right">
                        <p className="font-semibold text-lg text-emerald-600">{formatCurrency(totalPaid)}</p>
                        <p className="text-xs text-gray-500">{supplierPayments.length} payments</p>
                      </div>

                      {/* Debt */}
                      <div className="col-span-2 text-right">
                        <p className={`font-semibold text-lg ${debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(debt)}
                        </p>
                        <p className="text-xs text-gray-500">{debt > 0 ? 'Outstanding' : 'Paid'}</p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          supplier.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <i className={`fa-solid fa-circle mr-1 ${supplier.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`} style={{fontSize: '6px'}}></i>
                          {supplier.status || 'active'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => openPaymentModal(supplier)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all hover:scale-105"
                          title="Make Payment"
                        >
                          <i className="fa-solid fa-money-bill-wave"></i>
                        </button>
                        {/* Edit and Delete not supported by backend API
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                          title="Edit Supplier"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => openDeleteModal(supplier)}
                          className="p-2 text-status-red hover:bg-status-red/10 rounded-lg transition-colors"
                          title="Delete Supplier"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        */}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <span className="col-span-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supplier</span>
              <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Amount</span>
              <span className="col-span-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Payment Date</span>
              <span className="col-span-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredAndSortedPayments.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <i className="fa-solid fa-money-bill-wave text-6xl mb-4 text-gray-300"></i>
                  <p className="text-xl font-medium mb-2">No payments found</p>
                  <p className="text-sm">Try adjusting your filters or make a new payment</p>
                </div>
              ) : (
                filteredAndSortedPayments.map((payment) => (
                  <div key={payment.payment_id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                    {/* Supplier */}
                    <div className="col-span-3">
                      <p className="font-semibold text-gray-700">{payment.supplier_name}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {payment.supplier_id?.substring(0, 8)}...</p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-lg text-emerald-600">{formatCurrency(payment.amount)}</p>
                    </div>

                    {/* Payment Date */}
                    <div className="col-span-3">
                      <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => openViewPaymentModal(payment)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all hover:scale-105"
                        title="View Details"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        onClick={() => openEditPaymentModal(payment)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hover:scale-105"
                        title="Edit Payment"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Create Supplier Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Add New Supplier</h3>
                <p className="text-text-secondary">Create a new supplier</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <FormField
                id="name"
                label="Supplier Name *"
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleCreateSupplier} className="flex-1">
                <i className="fa-solid fa-plus mr-2"></i> Create Supplier
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Edit Supplier Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Edit Supplier</h3>
                <p className="text-text-secondary">Update supplier information</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <FormField
                id="name"
                label="Supplier Name *"
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <FormField
                id="contact_info"
                label="Contact Information"
                placeholder="Phone, email, etc."
                value={formData.contact_info}
                onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
              />
              <FormField
                id="address"
                label="Address"
                placeholder="Supplier address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleEditSupplier} className="flex-1">
                <i className="fa-solid fa-save mr-2"></i> Update Supplier
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Payment Modal */}
        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Make Payment</h3>
                <p className="text-text-secondary">Pay supplier</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Supplier *</label>
                <select
                  value={paymentData.supplier_id}
                  onChange={(e) => setPaymentData({...paymentData, supplier_id: e.target.value})}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.supplier_id || supplier.id} value={supplier.supplier_id || supplier.id}>
                      {supplier.name} - {supplier.contact_info}
                    </option>
                  ))}
                </select>
              </div>
              <NumberField
                id="amount"
                label="Payment Amount (RWF)"
                placeholder="Enter payment amount"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                required={true}
                min={1}
                step="1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowPaymentModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleMakePayment} className="flex-1">
                <i className="fa-solid fa-money-bill-wave mr-2"></i> Make Payment
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* View Payment Modal */}
        <Modal isOpen={showViewPaymentModal} onClose={() => setShowViewPaymentModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Payment Details</h3>
                <p className="text-text-secondary">View payment information</p>
              </div>
              <button 
                onClick={() => setShowViewPaymentModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            {selectedPayment && (
              <div className="space-y-4">
                <div className="bg-light-bg p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary">Supplier</p>
                      <p className="font-medium text-text-primary">{selectedPayment.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Amount</p>
                      <p className="font-medium text-text-primary">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Payment Date</p>
                      <p className="font-medium text-text-primary">{formatDate(selectedPayment.payment_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Payment ID</p>
                      <p className="font-medium text-text-primary">{selectedPayment.payment_id?.substring(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowViewPaymentModal(false)} className="flex-1">
                Close
              </SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Edit Payment Modal */}
        <Modal isOpen={showEditPaymentModal} onClose={() => setShowEditPaymentModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Edit Payment</h3>
                <p className="text-text-secondary">Update payment information</p>
              </div>
              <button 
                onClick={() => setShowEditPaymentModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Supplier</label>
                <select
                  value={editPaymentData.supplier_id}
                  onChange={(e) => setEditPaymentData({...editPaymentData, supplier_id: e.target.value})}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  required
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <NumberField
                id="edit_amount"
                label="Amount (RWF)"
                placeholder="Enter payment amount"
                value={editPaymentData.amount}
                onChange={(e) => setEditPaymentData({...editPaymentData, amount: e.target.value})}
                required={true}
                min={1}
                step="1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowEditPaymentModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleEditPayment} className="flex-1">
                <i className="fa-solid fa-save mr-2"></i> Update Payment
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Delete Supplier</h3>
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
                Are you sure you want to delete this supplier? This will permanently remove the supplier from the system.
              </p>
            </div>

            {selectedSupplier && (
              <div className="bg-light-bg p-4 rounded-lg">
                <p className="font-medium text-text-primary">{selectedSupplier.name}</p>
                <p className="text-sm text-text-secondary">{selectedSupplier.contact_info}</p>
                <p className="text-sm text-text-secondary">{selectedSupplier.address}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowDeleteModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleDeleteSupplier} className="flex-1 bg-status-red hover:bg-status-red/90">
                <i className="fa-solid fa-trash mr-2"></i> Delete Supplier
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}
