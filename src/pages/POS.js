import { useMemo, useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ProductListItem from '../components/ProductListItem';
import FormField from '../components/FormField';
import ReceiptItemRow from '../components/ReceiptItemRow';
import Modal from '../components/Modal';
import SelectField from '../components/SelectField';
import ErrorToast from '../components/ErrorToast';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { productAPI, receiptAPI, customerAPI } from '../services/api';
import { downloadReceiptPDF, printReceipt } from '../utils/receiptUtils';

export default function POS() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [receiptCreated, setReceiptCreated] = useState(false);
  
  // Payment options
  const [notPaidFull, setNotPaidFull] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone_number: '',
    government_id: ''
  });

  // Load products and customers on component mount
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    setError('');
    try {
      const response = await productAPI.getAllProducts();
      console.log('Products fetched:', response);
      const productsData = Array.isArray(response) ? response : (response.data || response.products || []);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Unable to load products. Please check your connection and try again.');
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
      // Don't show error for customers as it's not critical for POS
    }
  };

  // Calculate totals
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    [cartItems]
  );
  const taxes = useMemo(() => subtotal * 0.18, [subtotal]); // 18% tax rate
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  // Calculate remaining amount when not paid full
  const remainingAmount = useMemo(() => {
    if (!notPaidFull) return 0;
    return Math.max(0, total - amountPaid);
  }, [notPaidFull, total, amountPaid]);

  // Add product to cart
  const addToCart = () => {
    if (selectedProduct && quantity > 0) {
      const existingItem = cartItems.find(item => item.product_id === selectedProduct.product_id);
      
      if (existingItem) {
        // Update existing item quantity
        setCartItems(prev => prev.map(item => 
          item.product_id === selectedProduct.product_id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      } else {
        // Add new item
        const newItem = {
          product_id: selectedProduct.product_id,
          name: selectedProduct.name,
          unitPrice: selectedProduct.selling_price || selectedProduct.untaxed_price || 0,
          quantity: quantity,
          image: selectedProduct.image_path || 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'
        };
        setCartItems(prev => [...prev, newItem]);
      }
      
      setShowQuantityModal(false);
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  // Update quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      setCartItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // Remove item from cart
  const removeItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.product_id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setNotPaidFull(false);
    setAmountPaid(0);
    setSelectedCustomer('');
    setReceiptCreated(false);
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setError('Please enter a customer name.');
      return;
    }

    if (!newCustomer.phone_number.trim()) {
      setError('Please enter a phone number.');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(newCustomer.phone_number)) {
      setError('Please enter a valid phone number.');
      return;
    }

    try {
      const response = await customerAPI.registerCustomer(newCustomer);
      console.log('Customer created successfully:', response);
      
      // Refresh customers list
      await fetchCustomers();
      
      // Set the new customer as selected
      const customerId = response.customer_id || response.id;
      setSelectedCustomer(customerId);
      
      // Close modal and reset form
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone_number: '', government_id: '' });
      
      setError('');
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError(err.message || 'Unable to create customer. Please try again.');
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    if (!lastReceipt && !receiptCreated) {
      setError('No receipt available to print. Please complete a purchase first.');
      return;
    }

    try {
      const result = printReceipt(lastReceipt);
      if (!result.success) {
        setError('Unable to print receipt. Please try again.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Print error:', err);
      setError('Unable to print receipt. Please try again.');
    }
  };

  // Handle download receipt
  const handleDownloadReceipt = () => {
    if (!lastReceipt || !receiptCreated) {
      setError('No receipt available to download. Please complete a purchase first.');
      return;
    }

    try {
      const result = downloadReceiptPDF(lastReceipt);
      if (!result.success) {
        setError('Unable to download receipt. Please try again.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Unable to download receipt. Please try again.');
    }
  };

  // Complete purchase
  const completePurchase = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items before checkout.");
      return;
    }

    if (notPaidFull && amountPaid <= 0) {
      setError("Please enter the amount paid.");
      return;
    }

    if (notPaidFull && amountPaid > total) {
      setError("Amount paid cannot be greater than total amount.");
      return;
    }

    if (notPaidFull && !selectedCustomer) {
      setError("Please select a customer for partial payment.");
      return;
    }
    
    setProcessing(true);
    setError("");

    try {
      console.log("Starting receipt creation for", cartItems.length, "items");
      
      // Prepare sale creators for the receipt
      const saleCreators = cartItems.map(item => {
        const product = products.find(p => p.product_id === item.product_id);
        return {
          number: item.quantity,
          qr_code: product?.qr_code || "2510" // Use actual QR code from product
        };
      });

      // Create receipt with conditional fields based on payment status
      const receiptData = {
        sale_creators: saleCreators,
        total: Math.round(total * 100), // Convert to cents
        ...(notPaidFull && {
          customer_id: selectedCustomer,
          unpaid: Math.round(remainingAmount * 100) // Convert to cents
        })
      };

      console.log("Creating receipt with data:", receiptData);
      const receiptResponse = await receiptAPI.createReceipt(receiptData);

      console.log("Receipt created successfully:", receiptResponse);

      // Get customer info if available
      const customerInfo = notPaidFull && selectedCustomer 
        ? customers.find(c => (c.customer_id || c.id) === selectedCustomer)
        : null;

      setLastReceipt({
        id: receiptResponse,
        items: cartItems,
        subtotal: subtotal,
        taxes: taxes,
        total: total,
        amountPaid: notPaidFull ? amountPaid : total,
        remaining: notPaidFull ? remainingAmount : 0,
        notPaidFull: notPaidFull,
        customer: customerInfo
      });

      // Mark receipt as successfully created
      setReceiptCreated(true);

      // Clear cart and show success
      clearCart();
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Failed to complete purchase:", err);
      setError('Unable to complete purchase. Please try again.');
      setReceiptCreated(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ErrorToast error={error} onClose={() => setError('')} />
      <PageLayout mainId="cashier-page" mainClassName="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Panel: Product Selection */}
        <section id="product-panel" className="lg:col-span-2 flex flex-col h-full min-h-0 bg-gradient-to-br from-white to-light-bg rounded-2xl shadow-xl p-6 border border-border-light">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                <i className="fa-solid fa-cash-register mr-3 text-brand-blue"></i>
                Point of Sale
              </h1>
              <p className="text-text-secondary">Search or scan products to add them to the cart</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-brand-blue/10 text-brand-blue px-3 py-2 rounded-full text-sm font-medium">
                <i className="fa-solid fa-qrcode mr-1"></i>
                Scan QR Code
              </div>
              <div className="text-right">
                <div className="text-xs text-text-secondary">Current Time</div>
                <div className="text-sm font-medium text-text-primary">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          {/* Enhanced Product Selection */}
          <div className="mb-6 bg-card-bg rounded-xl p-4 shadow-sm border border-border-light">
            <div className="relative">
              <label className="block text-sm font-medium text-text-primary mb-3">
                <i className="fa-solid fa-search mr-2 text-brand-blue"></i>
                Search & Select Products
              </label>
              <div className="relative">
                <SelectField
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const product = products.find(p => p.product_id === e.target.value);
                      if (product) {
                        setSelectedProduct(product);
                        setQuantity(1);
                        setShowQuantityModal(true);
                        setError('');
                      }
                    }
                  }}
                  options={[
                    { value: '', label: 'Search products by name, ID, or scan barcode...' },
                    ...products.map(product => ({
                      value: product.product_id,
                      label: `${product.name} - RWF ${product.selling_price || product.untaxed_price || 0}`
                    }))
                  ]}
                  searchable={true}
                  searchPlaceholder="Search products..."
                  className="w-full"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  <i className="fa-solid fa-barcode text-lg"></i>
                </div>
              </div>
            </div>
            {products.length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center text-text-secondary">
                    <i className="fa-solid fa-box mr-2 text-status-green"></i>
                    {products.length} products available
                  </span>
                  <span className="flex items-center text-text-secondary">
                    <i className="fa-solid fa-shopping-cart mr-2 text-brand-blue"></i>
                    {cartItems.length} items in cart
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  Press Enter to add selected product
                </div>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                <i className="fa-solid fa-shopping-cart mr-2 text-brand-blue"></i>
                Shopping Cart
              </h2>
              <div className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-sm font-medium">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 bg-card-bg rounded-xl border border-border-light">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <div className="w-24 h-24 mx-auto bg-light-bg rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-shopping-cart text-4xl text-text-secondary"></i>
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-text-primary">Your cart is empty</h3>
                  <p className="text-text-secondary mb-6">Search or scan products to get started</p>
                  <div className="max-w-md mx-auto p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/20">
                    <p className="text-sm text-brand-blue">
                      <i className="fa-solid fa-lightbulb mr-2"></i>
                      <strong>Quick Start:</strong> Use the search bar above or scan QR codes to add products to your cart
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={item.product_id} className="bg-gradient-to-r from-light-bg to-card-bg rounded-xl p-4 border border-border-light hover:shadow-md transition-all duration-200">
                      <ProductListItem
                        image={item.image}
                        name={item.name}
                        sku={item.product_id}
                        quantity={item.quantity}
                        unitPrice={item.unitPrice}
                        onQuantityChange={(q) => updateQuantity(item.product_id, q)}
                        onRemove={() => removeItem(item.product_id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel: Receipt */}
        <aside id="checkout-panel" className="lg:col-span-1 bg-gradient-to-br from-brand-blue/5 via-card-bg to-brand-blue/10 rounded-2xl shadow-xl flex flex-col p-6 min-h-0 border border-brand-blue/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                <i className="fa-solid fa-receipt mr-2 text-brand-blue"></i>
                Receipt
              </h2>
              <p className="text-sm text-text-secondary">Order Summary</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-secondary bg-card-bg px-3 py-1 rounded-full border border-border-light">
                #{new Date().getTime().toString().slice(-6)}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Enhanced Receipt-style container */}
          <div className="bg-card-bg border border-border-light rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-light">
              <p className="text-sm font-semibold text-text-primary">
                <i className="fa-solid fa-list mr-2 text-brand-blue"></i>
                Order Items
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary bg-light-bg px-2 py-1 rounded-full">{cartItems.length} items</span>
                <div className="w-2 h-2 bg-status-green rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <i className="fa-solid fa-shopping-basket text-3xl mb-3 text-text-secondary"></i>
                  <p className="text-sm font-medium">No items in cart</p>
                  <p className="text-xs text-text-secondary">Add products to see them here</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.product_id} className="bg-light-bg rounded-lg p-3 border border-border-light">
                    <ReceiptItemRow 
                      name={item.name} 
                      quantity={item.quantity} 
                      unitPrice={item.unitPrice} 
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="price-calculation" className="bg-card-bg rounded-xl p-4 mb-4 shadow-sm border border-border-light">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              <i className="fa-solid fa-calculator mr-2 text-brand-blue"></i>
              Price Calculation
            </h3>
            <div className="space-y-3 text-text-primary">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Subtotal</span>
                <span className="font-medium">RWF {subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Taxes (18%)</span>
                <span className="font-medium">RWF {taxes.toFixed(0)}</span>
              </div>
              <div className="border-t border-border-light my-3" />
              <div className="flex justify-between items-center text-xl font-bold bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 p-4 rounded-lg border border-brand-blue/20">
                <p className="text-brand-blue">Total Amount</p>
                <p className="font-mono text-brand-blue">RWF {total.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div id="payment-options" className="bg-card-bg rounded-xl p-4 mb-4 shadow-sm border border-border-light">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              <i className="fa-solid fa-credit-card mr-2 text-brand-blue"></i>
              Payment Options
            </h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-light-bg to-brand-blue/5 rounded-lg border border-border-light">
                <input
                  type="checkbox"
                  id="not-paid-full"
                  checked={notPaidFull}
                  onChange={(e) => {
                    setNotPaidFull(e.target.checked);
                    if (!e.target.checked) {
                      setAmountPaid(0);
                      setSelectedCustomer('');
                    } else {
                      // Don't auto-fill amount paid for partial payment
                      setAmountPaid(0);
                    }
                  }}
                  className="w-5 h-5 text-brand-blue bg-card-bg border-border-light rounded focus:ring-brand-blue focus:ring-2"
                />
                <label htmlFor="not-paid-full" className="ml-3 text-sm font-medium text-text-primary">
                  <i className="fa-solid fa-clock mr-2 text-status-yellow"></i>
                  Partial Payment (Customer Credit)
                </label>
              </div>

            {notPaidFull && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 rounded-lg border border-brand-blue/20">
                {/* Customer Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-text-primary">
                      <i className="fa-solid fa-user mr-2 text-brand-blue"></i>
                      Select Customer
                    </label>
                    <button 
                      onClick={() => setShowCustomerModal(true)}
                      className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium bg-card-bg px-3 py-1 rounded-full border border-brand-blue/20 hover:bg-brand-blue/5 transition-colors"
                    >
                      <i className="fa-solid fa-plus mr-1"></i>
                      Add New Customer
                    </button>
                  </div>
                  <SelectField
                    value={selectedCustomer}
                    onChange={(e) => {
                      console.log("Selected customer:", e.target.value);
                      setSelectedCustomer(e.target.value);
                    }}
                    options={[
                      { value: '', label: 'Select customer...' },
                      ...customers.map(customer => ({
                        value: customer.customer_id || customer.id || '9f62b8d3-96c1-4194-bfbe-d8bc7cea2308',
                        label: customer.name || customer.customer_name || `Customer ${customer.customer_id || customer.id}`
                      }))
                    ]}
                    searchable={true}
                    searchPlaceholder="Search customers..."
                    className="w-full"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <i className="fa-solid fa-money-bill-wave mr-2 text-status-green"></i>
                    Amount Paid (RWF)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-card-bg border border-border-light rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none focus:border-brand-blue"
                  />
                </div>
                
                {remainingAmount > 0 && (
                  <div className="bg-gradient-to-r from-status-yellow/10 to-status-red/10 border border-status-yellow/30 rounded-lg p-4">
                    <p className="text-sm text-status-red font-medium">
                      <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                      Remaining Balance: <span className="font-bold text-lg">RWF {remainingAmount.toFixed(0)}</span>
                    </p>
                    <p className="text-xs text-status-red mt-1">This amount will be added to customer's credit</p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          <div id="quick-actions" className="mt-auto space-y-4">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={clearCart} 
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-status-red/10 to-status-red/20 text-status-red font-semibold rounded-xl hover:from-status-red/20 hover:to-status-red/30 transition-all duration-200 border border-status-red/20"
              >
                <i className="fa-solid fa-trash-can" />
                <span className="hidden sm:inline">Clear Cart</span>
              </button>
              <button 
                onClick={handlePrintReceipt}
                disabled={!receiptCreated}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-text-secondary/10 to-text-secondary/20 text-text-secondary font-semibold rounded-xl hover:from-text-secondary/20 hover:to-text-secondary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-text-secondary/20"
              >
                <i className="fa-solid fa-print" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
            
            <button 
              onClick={handleDownloadReceipt}
              disabled={!receiptCreated}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-status-green/10 to-status-green/20 text-status-green font-semibold rounded-xl hover:from-status-green/20 hover:to-status-green/30 transition-all duration-200 border border-status-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-download" />
              Download Receipt PDF
            </button>
            
            {/* Main Checkout Button */}
            <button 
              id="checkout-button" 
              onClick={completePurchase}
              disabled={processing || cartItems.length === 0 || (notPaidFull && (!selectedCustomer || amountPaid <= 0))}
              className="w-full py-4 bg-gradient-to-r from-brand-blue via-brand-blue/90 to-brand-blue/80 text-white font-bold text-lg rounded-xl shadow-xl hover:from-brand-blue/90 hover:via-brand-blue/80 hover:to-brand-blue/70 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-brand-blue"
            >
              {processing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Processing Purchase...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock mr-2" />
                  Complete Purchase
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Quantity Modal */}
        <Modal isOpen={showQuantityModal} onClose={() => setShowQuantityModal(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Add to Cart</h3>
            {selectedProduct && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img 
                  className="w-16 h-16 rounded-lg object-cover" 
                  src={selectedProduct.image_path || 'https://imgs.search.brave.com/DP2afJxazARIwseHVgstUyjfPwZ2BIa4i8jaZkpUR1w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2FkL2Vj/LzM5L2FkZWMzOTY0/ODZhY2FlZDE3MWIy/YjlkY2JlZDMzZmE4/L.mpwZw'} 
                  alt={selectedProduct.name} 
                />
                                <div>
                    <h4 className="font-semibold text-text-primary">{selectedProduct.name}</h4>
                    <p className="text-sky-600 font-medium">
                      RWF {(selectedProduct.selling_price || selectedProduct.untaxed_price || 0).toFixed(0)}
                    </p>
                  </div>
              </div>
            )}
            <FormField
              id="quantity"
              label="Quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              inputProps={{
                className: 'w-full px-4 py-2 bg-white border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none'
              }}
            />
            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowQuantityModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={addToCart} className="flex-1">
                Add to Cart
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Add Customer Modal */}
        <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Add New Customer</h3>
            <div className="space-y-3">
              <FormField
                id="customer-name"
                label="Customer Name"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
              <FormField
                id="customer-phone"
                label="Phone Number"
                placeholder="Enter phone number"
                value={newCustomer.phone_number}
                onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
              />
              <FormField
                id="customer-government-id"
                label="Government ID (Optional)"
                placeholder="Enter government ID"
                value={newCustomer.government_id}
                onChange={(e) => setNewCustomer({...newCustomer, government_id: e.target.value})}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <SecondaryButton onClick={() => setShowCustomerModal(false)} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleCreateCustomer} className="flex-1">
                Add Customer
              </PrimaryButton>
            </div>
          </div>
        </Modal>

        {/* Success Modal */}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Purchase Complete!</h3>
            <p className="text-text-secondary">
              Receipt ID: <span className="font-mono font-medium">{lastReceipt?.id}</span>
            </p>
            <p className="text-text-secondary">
              Total: <span className="font-bold text-sky-600">RWF {lastReceipt?.total?.toFixed(0)}</span>
            </p>
            {lastReceipt?.notPaidFull && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                  Amount Paid: <span className="font-semibold">RWF {lastReceipt?.amountPaid?.toFixed(0)}</span>
                </p>
                <p className="text-sm text-yellow-800">
                  Remaining: <span className="font-semibold">RWF {lastReceipt?.remaining?.toFixed(0)}</span>
                </p>
              </div>
            )}
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-2">Items purchased:</p>
              <div className="space-y-1">
                {lastReceipt?.items?.map((item, index) => (
                  <p key={index} className="text-text-secondary">
                    {item.name} x{item.quantity} - RWF {(item.quantity * item.unitPrice).toFixed(0)}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <SecondaryButton onClick={() => setShowSuccessModal(false)} className="flex-1">
                Close
              </SecondaryButton>
              <PrimaryButton onClick={handlePrintReceipt} className="flex-1">
                <i className="fa-solid fa-print mr-2"></i> Print Receipt
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}
