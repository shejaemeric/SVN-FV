import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NavIcon = ({ to, iconClass, active, label, expanded, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={
      `p-3 rounded-lg transition-all duration-300 cursor-pointer group relative ` +
      (active ? 'bg-sky-600 text-white shadow-md' : 'text-gray-500 hover:bg-sky-100 hover:text-sky-600')
    }
    aria-label={label}
  >
    <i className={iconClass} />
    {expanded && (
      <span className="ml-3 text-sm font-medium">{label}</span>
    )}
    {!expanded && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] top-1/2 transform -translate-y-1/2">
        {label}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800"></div>
      </div>
    )}
  </Link>
);

export default function Sidebar() {
  const location = useLocation();
  
  // Initialize expanded state from localStorage, default to true
  const [expanded, setExpanded] = useState(() => {
    try {
      const savedState = localStorage.getItem('sidebar-expanded');
      return savedState ? JSON.parse(savedState) : true;
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
      return true;
    }
  });
  
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAddBatch = location.pathname.startsWith('/batches');
  const isInventory = location.pathname.startsWith('/inventory');
  const isReceipts = location.pathname.startsWith('/receipts');
  const isStocks = location.pathname.startsWith('/stocks');
  const isSuppliers = location.pathname.startsWith('/suppliers');
  const isSales = location.pathname.startsWith('/sales');
  const isCustomers = location.pathname.startsWith('/customers');

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-expanded', JSON.stringify(expanded));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [expanded]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <nav id="sidebar" className={`flex flex-col bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-3 justify-between transition-all duration-300 relative z-[100] ${
      expanded ? 'w-64 items-start' : 'w-20 items-center'
    }`}>
      <div className={`flex flex-col gap-4 ${expanded ? 'w-full' : 'items-center'}`}>
        <div className={`flex items-center gap-3 ${expanded ? 'w-full' : 'justify-center'}`}>
          <Link to="/" id="logo" className="flex items-center justify-center h-10 w-10 bg-sky-600 rounded-xl text-white font-bold text-lg shadow-lg">
            7-5
          </Link>
          {expanded && (
            <span className="text-lg font-bold text-gray-700">Inventory System</span>
          )}
        </div>
        
        <div id="nav-links" className={`flex flex-col gap-2 ${expanded ? 'w-full' : 'items-center'}`}>
          <NavIcon 
            to="/dashboard" 
            iconClass="fa-solid fa-chart-pie" 
            active={isDashboard} 
            label="Dashboard"
            expanded={expanded}
          />
          <NavIcon 
            to="/pos" 
            iconClass="fa-solid fa-cash-register" 
            active={location.pathname.startsWith('/pos')} 
            label="Point of Sale"
            expanded={expanded}
          />
          <NavIcon 
            to="/batches/new" 
            iconClass="fa-solid fa-plus-square" 
            active={isAddBatch} 
            label="Add Batch"
            expanded={expanded}
          />
          <NavIcon 
            to="/inventory" 
            iconClass="fa-solid fa-boxes-stacked" 
            active={isInventory} 
            label="Inventory"
            expanded={expanded}
          />
          <NavIcon 
            to="/stocks" 
            iconClass="fa-solid fa-warehouse" 
            active={isStocks} 
            label="Stocks"
            expanded={expanded}
          />
          <NavIcon 
            to="/suppliers" 
            iconClass="fa-solid fa-truck" 
            active={isSuppliers} 
            label="Suppliers"
            expanded={expanded}
          />
          <NavIcon 
            to="/sales" 
            iconClass="fa-solid fa-chart-line" 
            active={isSales} 
            label="Sales"
            expanded={expanded}
          />
          <NavIcon 
            to="/customers" 
            iconClass="fa-solid fa-users" 
            active={isCustomers} 
            label="Customers"
            expanded={expanded}
          />
          <NavIcon 
            to="/receipts" 
            iconClass="fa-solid fa-receipt" 
            active={isReceipts} 
            label="Receipts"
            expanded={expanded}
          />
        </div>
      </div>
      
      <div className={`flex flex-col gap-2 ${expanded ? 'w-full' : 'items-center'}`}>
        <Link 
          to="/settings"
          className={`p-2 rounded-lg text-gray-500 hover:bg-sky-100 hover:text-sky-600 transition-all duration-300 cursor-pointer group relative ${expanded ? 'flex items-center w-full' : ''}`}
          title={!expanded ? 'Settings' : ''}
        >
          <i className="fa-solid fa-gear" />
          {expanded && <span className="ml-2 text-sm">Settings</span>}
          {!expanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] top-1/2 transform -translate-y-1/2">
              Settings
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800"></div>
            </div>
          )}
        </Link>
        
        <button 
          onClick={toggleExpanded}
          className={`p-2 rounded-lg text-gray-500 hover:bg-sky-100 hover:text-sky-600 transition-all duration-300 cursor-pointer group relative ${expanded ? 'flex items-center w-full' : ''}`}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <i className={`fa-solid ${expanded ? 'fa-angle-left' : 'fa-angle-right'} transition-transform duration-200`} />
          {expanded && <span className="ml-2 text-sm">Collapse</span>}
          {!expanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] top-1/2 transform -translate-y-1/2">
              Expand
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800"></div>
            </div>
          )}
        </button>
        
{/*         <div className="flex justify-center">
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
            alt="User Avatar"
            className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer hover:border-sky-500 transition-colors"
            title="Profile"
          />
        </div> */}
      </div>
    </nav>
  );
} 