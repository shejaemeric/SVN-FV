import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import FormField from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { ErrorToast } from '../components/ErrorToast';
import Modal from '../components/Modal';
import { customerAPI, receiptAPI, handleAPIError } from '../services/api';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';
import { exportTableToPDF, getTableColumns } from '../utils/exportUtils';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    government_id: ''
  });
  
  // Credit form state
  const [creditData, setCreditData] = useState({
    phone_number: '',
    amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [customersResponse, receiptsResponse] = await Promise.all([
        customerAPI.getAllCustomers(),
        receiptAPI.getAllReceipts()
      ]);
      
      const customersData = Array.isArray(customersResponse) ? customersResponse : (customersResponse.data || customersResponse.customers || []);
      const receiptsData = Array.isArray(receiptsResponse) ? receiptsResponse : (receiptsResponse.data || receiptsResponse.receipts || []);
      
      setCustomers(customersData);
      setReceipts(receiptsData);
      
      // Debug: Log customer data to see the structure
      console.log('Customers data:', customersData);
      console.log('Sample customer:', customersData[0]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(search) ||
        customer.phone_number?.toLowerCase().includes(search) ||
        customer.government_id?.toLowerCase().includes(search)
      );
    }

    // Additional filters
    if (filterBy) {
      switch (filterBy) {
        case 'active':
          filtered = filtered.filter(customer => customer.status !== 'inactive');
          break;
        case 'inactive':
          filtered = filtered.filter(customer => customer.status === 'inactive');
          break;
        case 'with_orders':
          filtered = filtered.filter(customer => 
            receipts.some(receipt => receipt.customer_id === customer.customer_id)
          );
          break;
        case 'no_orders':
          filtered = filtered.filter(customer => 
            !receipts.some(receipt => receipt.customer_id === customer.customer_id)
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
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'phone_number':
          aValue = a.phone_number || '';
          bValue = b.phone_number || '';
          break;
        case 'government_id':
          aValue = a.government_id || '';
          bValue = b.government_id || '';
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
  }, [customers, receipts, searchTerm, sortBy, sortOrder, filterBy]);

  const handleCreateCustomer = async () => {
    if (!formData.name.trim() || !formData.phone_number.trim()) {
      setError('Please fill in name and phone number.');
      return;
    }

    try {
      await customerAPI.registerCustomer(formData);
      setShowCreateModal(false);
      setFormData({ name: '', phone_number: '', government_id: '' });
      setError('');
      await fetchData();
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError(handleAPIError(err));
    }
  };

  const handleCreditCustomer = async () => {
    if (!selectedCustomer || !creditData.amount || parseFloat(creditData.amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    try {
      await customerAPI.creditCustomer({
        phone_number: selectedCustomer.phone_number,
        amount: parseInt(creditData.amount)
      });
      setShowCreditModal(false);
      setSelectedCustomer(null);
      setCreditData({ phone_number: '', amount: '' });
      setError('');
      await fetchData();
    } catch (err) {
      console.error('Failed to credit customer:', err);
      setError(handleAPIError(err));
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      // Use 'id' field from FoundCustomer structure
      await customerAPI.deleteCustomer(selectedCustomer.id || selectedCustomer.customer_id);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      setError('');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setError(handleAPIError(err));
    }
  };

  const openCreditModal = (customer) => {
    setSelectedCustomer(customer);
    setCreditData({
      phone_number: customer.phone_number || '',
      amount: ''
    });
    setShowCreditModal(true);
  };

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
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

  const handleExportCustomers = () => {
    const columns = getTableColumns('customers');
    const exportData = customers.map(customer => {
      return {
        ...customer,
        total_debt: formatCurrency(customer.total_owed || 0)
      };
    });
    exportTableToPDF(exportData, columns, 'Customers Report', `customers-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getCustomerStats = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    const totalDebt = parseFloat(customer?.total_owed) || 0;
    
    return { totalDebt };
  };

  if (loading) {
    return (
      <PageLayout mainId="customers-page" mainClassName="flex flex-col overflow-hidden">
        <Header title="Customer Management" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading customer data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <ErrorToast error={error} onClose={() => setError('')} />
      <PageLayout mainId="customers-page" mainClassName="flex flex-col overflow-hidden">
        <Header
          title="Customer Management"
          subtitle={`${filteredAndSortedCustomers.length} customers`}
          right={
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCustomers}
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
                <span>Add Customer</span>
              </button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fa-solid fa-users text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Customers</p>
                  </div>
                  <p className="text-4xl font-semibold text-gray-700 mb-1">{formatNumberWithCommas(customers.length)}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    <i className="fa-solid fa-arrow-up text-xs mr-1"></i>
                    Active accounts
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-red-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fa-solid fa-exclamation-triangle text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Debt Owed</p>
                  </div>
                  <p className="text-4xl font-semibold text-gray-700 mb-1">{formatCurrency(customers.reduce((sum, c) => sum + (parseFloat(c.total_owed) || 0), 0))}</p>
                  <p className="text-sm text-red-600 font-medium">
                    <i className="fa-solid fa-info-circle text-xs mr-1"></i>
                    Outstanding payments
                  </p>
                </div>
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
                placeholder="Search customers by name, phone, ID..."
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
                <option value="">All Customers</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="with_orders">With Orders</option>
                <option value="no_orders">No Orders</option>
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
                <option value="phone_number-asc">Phone (A-Z)</option>
                <option value="phone_number-desc">Phone (Z-A)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSearchTerm('');
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

        {/* Customers Table */}
        <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <span className="col-span-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Customer</span>
            <span className="col-span-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Phone</span>
 {/*             <span className="col-span-3 font-semibold text-text-secondary">Government ID</span>*/}            
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Debt</span>
            <span className="col-span-2 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedCustomers.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <i className="fa-solid fa-users text-6xl mb-4 text-gray-300"></i>
                <p className="text-xl font-medium mb-2">No customers found</p>
                <p className="text-sm">Try adjusting your filters or add a new customer</p>
              </div>
            ) : (
              filteredAndSortedCustomers.map((customer) => {
                const stats = getCustomerStats(customer.customer_id);
                
                return (
                  <div key={customer.customer_id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                    {/* Customer */}
                    <div className="col-span-4">
                      <p className="font-semibold text-gray-700">{customer.name}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {customer.customer_id?.substring(0, 8)}...</p>
                    </div>

                    {/* Phone */}
                    <div className="col-span-4">
                      <p className="text-sm text-gray-600">{customer.phone_number || 'N/A'}</p>
                    </div>

                    {/* Government ID */}
 {/*                    <div className="col-span-3">
                      <p className="text-sm text-text-primary">{customer.government_id || 'N/A'}</p>
                    </div> */}

                    {/* Debt */}
                    <div className="col-span-2 text-right">
                      <p className={`font-semibold text-lg ${stats.totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(stats.totalDebt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.totalDebt > 0 ? 'Outstanding' : 'Paid'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openDetailsModal(customer)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all hover:scale-105"
                        title="View Details"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {stats.totalDebt > 0 && (
                        <button
                          onClick={() => openCreditModal(customer)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all hover:scale-105"
                          title="Make Payment"
                        >
                          <i className="fa-solid fa-money-bill-wave"></i>
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteModal(customer)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:scale-105"
                        title="Delete Customer"
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

        {/* Create Customer Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Add New Customer</h3>
                <p className="text-text-secondary">Create a new customer</p>
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
                label="Customer Name *"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <FormField
                id="phone_number"
                label="Phone Number *"
                placeholder="Enter phone number"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              />
              <FormField
                id="government_id"
                label="Government ID"
                placeholder="Enter government ID (optional)"
                value={formData.government_id}
                onChange={(e) => setFormData({...formData, government_id: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleCreateCustomer} className="flex-1">
                <i className="fa-solid fa-plus mr-2"></i> Create Customer
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Credit Customer Modal */}
        <Modal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Make Payment</h3>
                <p className="text-text-secondary">Reduce customer debt</p>
              </div>
              <button 
                onClick={() => setShowCreditModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            {selectedCustomer && (
              <div className="bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-secondary text-sm">Customer</p>
                    <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Current Debt</p>
                    <p className="font-semibold text-lg text-status-red">{formatCurrencyWhole(selectedCustomer.total_owed || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <FormField
                id="credit_amount"
                label="Payment Amount (RWF) *"
                type="number"
                placeholder="Enter payment amount"
                value={creditData.amount}
                onChange={(e) => setCreditData({...creditData, amount: e.target.value})}
                inputProps={{
                  min: 1,
                  max: selectedCustomer?.total_owed || undefined
                }}
              />
              <div className="text-sm text-text-secondary">
                <p>• Enter the amount the customer is paying</p>
                <p>• Maximum: {formatCurrencyWhole(selectedCustomer?.total_owed || 0)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowCreditModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleCreditCustomer} className="flex-1 bg-status-green hover:bg-status-green/90">
                <i className="fa-solid fa-money-bill-wave mr-2"></i> Process Payment
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Customer Details Modal */}
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Customer Details</h3>
                <p className="text-text-secondary">Customer information and order history</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            {selectedCustomer && (
              <>
                {/* Customer Info */}
                <div className="bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 p-6 rounded-xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-text-secondary text-sm">Name</p>
                      <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm">Phone Number</p>
                      <p className="font-semibold text-lg">{selectedCustomer.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm">Government ID</p>
                      <p className="font-semibold text-lg">{selectedCustomer.government_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm">Customer ID</p>
                      <p className="font-semibold text-lg font-mono">{selectedCustomer.customer_id}</p>
                    </div>
                  </div>
                </div>

                {/* Debt Statistics */}
                {(() => {
                  const stats = getCustomerStats(selectedCustomer.customer_id);
                  return (
                    <div className="grid grid-cols-1 gap-4">
                      <div className={`p-6 rounded-lg text-center ${stats.totalDebt > 0 ? 'bg-status-red/10' : 'bg-status-green/10'}`}>
                        <p className={`text-sm ${stats.totalDebt > 0 ? 'text-status-red' : 'text-status-green'}`}>Outstanding Debt</p>
                        <p className={`text-3xl font-bold ${stats.totalDebt > 0 ? 'text-status-red' : 'text-status-green'}`}>{formatCurrency(stats.totalDebt)}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Order History */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Order History</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {receipts.filter(r => r.customer_id === selectedCustomer.customer_id).length === 0 ? (
                      <div className="text-center py-8 text-text-secondary">
                        <i className="fa-solid fa-shopping-cart text-3xl mb-3 text-gray-300"></i>
                        <p className="text-sm">No orders found for this customer</p>
                      </div>
                    ) : (
                      receipts.filter(r => r.customer_id === selectedCustomer.customer_id).map((receipt) => (
                        <div key={receipt.id} className="flex justify-between items-center p-3 bg-light-bg rounded-lg">
                          <div>
                            <p className="font-medium text-text-primary">Receipt #{receipt.id.substring(0, 8)}...</p>
                            <p className="text-sm text-text-secondary">{formatDate(receipt.created_at)}</p>
                          </div>
                          <p className="font-semibold text-text-primary">{formatCurrency(receipt.total)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowDetailsModal(false)} className="flex-1">
                Close
              </SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-6 max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Delete Customer</h3>
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
                Are you sure you want to delete this customer? This will permanently remove the customer from the system.
              </p>
            </div>

            {selectedCustomer && (
              <div className="bg-light-bg p-4 rounded-lg">
                <p className="font-medium text-text-primary">{selectedCustomer.name}</p>
                <p className="text-sm text-text-secondary">{selectedCustomer.phone_number}</p>
                <p className="text-sm text-text-secondary">{selectedCustomer.government_id}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowDeleteModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleDeleteCustomer} className="flex-1 bg-status-red hover:bg-status-red/90">
                <i className="fa-solid fa-trash mr-2"></i> Delete Customer
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}
