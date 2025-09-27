import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import Card from '../components/Card';
import SectionBlock from '../components/SectionBlock';
import FormField from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ErrorToast from '../components/ErrorToast';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    government_id: ''
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
        case 'total_orders':
          aValue = receipts.filter(r => r.customer_id === a.customer_id).length;
          bValue = receipts.filter(r => r.customer_id === b.customer_id).length;
          break;
        case 'total_spent':
          aValue = receipts.filter(r => r.customer_id === a.customer_id).reduce((sum, r) => sum + (r.total || 0), 0);
          bValue = receipts.filter(r => r.customer_id === b.customer_id).reduce((sum, r) => sum + (r.total || 0), 0);
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

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name.trim() || !formData.phone_number.trim()) {
      setError('Please fill in name and phone number.');
      return;
    }

    try {
      await customerAPI.editCustomer({
        customer_id: selectedCustomer.customer_id,
        ...formData
      });
      setShowEditModal(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phone_number: '', government_id: '' });
      setError('');
      await fetchData();
    } catch (err) {
      console.error('Failed to edit customer:', err);
      setError(handleAPIError(err));
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await customerAPI.deleteCustomer(selectedCustomer.customer_id);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      setError('');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setError(handleAPIError(err));
    }
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone_number: customer.phone_number || '',
      government_id: customer.government_id || ''
    });
    setShowEditModal(true);
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
      const stats = getCustomerStats(customer.customer_id);
      return {
        ...customer,
        total_orders: stats.totalOrders,
        total_spent: formatCurrency(stats.totalSpent),
        total_debt: formatCurrency(parseFloat(customer.total_owed) || parseFloat(customer.debt) || parseFloat(customer.outstanding_amount) || parseFloat(customer.balance) || 0)
      };
    });
    exportTableToPDF(exportData, columns, 'Customers Report', `customers-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getCustomerStats = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    const customerReceipts = receipts.filter(r => r.customer_id === customerId);
    const totalOrders = customerReceipts.length;
    const totalSpent = customerReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
    // Try different possible field names for debt
    const totalDebt = parseFloat(customer?.total_owed) || parseFloat(customer?.debt) || parseFloat(customer?.outstanding_amount) || parseFloat(customer?.balance) || 0;
    
    // Debug: Log debt calculation
    console.log(`Customer ${customer?.name}: total_owed=${customer?.total_owed}, debt=${customer?.debt}, outstanding_amount=${customer?.outstanding_amount}, balance=${customer?.balance}, final=${totalDebt}`);
    
    const lastOrder = customerReceipts.length > 0 ? 
      new Date(Math.max(...customerReceipts.map(r => new Date(r.created_at || 0)))) : null;
    
    return { totalOrders, totalSpent, totalDebt, lastOrder };
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-brand-blue to-brand-blue/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Customers</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(customers.length)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-users text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-brand-purple to-brand-purple/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Customer Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(receipts.filter(r => r.customer_id).reduce((sum, r) => sum + (r.total || 0), 0))}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-money-bill-wave text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-status-red to-status-red/80 p-4 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Debt Owed</p>
                <p className="text-2xl font-bold">{formatCurrency(customers.reduce((sum, c) => {
                  // Try different possible field names for debt
                  const debt = parseFloat(c.total_owed) || parseFloat(c.debt) || parseFloat(c.outstanding_amount) || parseFloat(c.balance) || 0;
                  return sum + debt;
                }, 0))}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-exclamation-triangle text-xl"></i>
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
                <option value="total_orders-desc">Orders (Most)</option>
                <option value="total_orders-asc">Orders (Least)</option>
                <option value="total_spent-desc">Spent (Most)</option>
                <option value="total_spent-asc">Spent (Least)</option>
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
        <section className="flex-1 flex flex-col bg-card-bg rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 border-b border-border-light">
            <span className="col-span-2 font-semibold text-text-secondary">Customer</span>
            <span className="col-span-2 font-semibold text-text-secondary">Phone</span>
            <span className="col-span-2 font-semibold text-text-secondary">Government ID</span>
            <span className="col-span-1 font-semibold text-text-secondary text-center">Orders</span>
            <span className="col-span-2 font-semibold text-text-secondary text-right">Total Spent</span>
            <span className="col-span-2 font-semibold text-text-secondary text-right">Debt</span>
            <span className="col-span-1 font-semibold text-text-secondary text-center">Actions</span>
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
                  <div key={customer.customer_id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-border-light hover:bg-light-bg transition-colors">
                    {/* Customer */}
                    <div className="col-span-2">
                      <p className="font-medium text-text-primary">{customer.name}</p>
                      <p className="text-sm text-text-secondary">ID: {customer.customer_id?.substring(0, 8)}...</p>
                    </div>

                    {/* Phone */}
                    <div className="col-span-2">
                      <p className="text-sm text-text-primary">{customer.phone_number || 'N/A'}</p>
                    </div>

                    {/* Government ID */}
                    <div className="col-span-2">
                      <p className="text-sm text-text-primary">{customer.government_id || 'N/A'}</p>
                    </div>

                    {/* Orders */}
                    <div className="col-span-1 text-center">
                      <span className="font-semibold text-text-primary">
                        {formatNumberWithCommas(stats.totalOrders)}
                      </span>
                    </div>

                    {/* Total Spent */}
                    <div className="col-span-2 text-right">
                      <p className="font-medium text-text-primary">{formatCurrency(stats.totalSpent)}</p>
                    </div>

                    {/* Debt */}
                    <div className="col-span-2 text-right">
                      <p className={`font-medium ${stats.totalDebt > 0 ? 'text-status-red' : 'text-status-green'}`}>
                        {formatCurrency(stats.totalDebt)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {stats.totalDebt > 0 ? 'Outstanding' : 'Paid'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center gap-1">
                      <button
                        onClick={() => openDetailsModal(customer)}
                        className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-status-yellow hover:bg-status-yellow/10 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => openDeleteModal(customer)}
                        className="p-2 text-status-red hover:bg-status-red/10 rounded-lg transition-colors"
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

        {/* Edit Customer Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">Edit Customer</h3>
                <p className="text-text-secondary">Update customer information</p>
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
              <SecondaryButton onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleEditCustomer} className="flex-1">
                <i className="fa-solid fa-save mr-2"></i> Update Customer
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

                {/* Order Statistics */}
                {(() => {
                  const stats = getCustomerStats(selectedCustomer.customer_id);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-status-green/10 p-4 rounded-lg text-center">
                        <p className="text-status-green text-sm">Total Orders</p>
                        <p className="text-2xl font-bold text-status-green">{stats.totalOrders}</p>
                      </div>
                      <div className="bg-brand-blue/10 p-4 rounded-lg text-center">
                        <p className="text-brand-blue text-sm">Total Spent</p>
                        <p className="text-2xl font-bold text-brand-blue">{formatCurrency(stats.totalSpent)}</p>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${stats.totalDebt > 0 ? 'bg-status-red/10' : 'bg-status-green/10'}`}>
                        <p className={`text-sm ${stats.totalDebt > 0 ? 'text-status-red' : 'text-status-green'}`}>Outstanding Debt</p>
                        <p className={`text-2xl font-bold ${stats.totalDebt > 0 ? 'text-status-red' : 'text-status-green'}`}>{formatCurrency(stats.totalDebt)}</p>
                      </div>
                      <div className="bg-status-yellow/10 p-4 rounded-lg text-center">
                        <p className="text-status-yellow text-sm">Last Order</p>
                        <p className="text-lg font-bold text-status-yellow">{stats.lastOrder ? formatDate(stats.lastOrder) : 'Never'}</p>
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
