import { Link, useLocation } from 'react-router-dom';

const NavIcon = ({ to, iconClass, active }) => (
  <Link
    to={to}
    className={
      `p-3 rounded-lg transition-all duration-300 cursor-pointer ` +
      (active ? 'bg-sky-600 text-white shadow-md' : 'text-gray-500 hover:bg-sky-100 hover:text-sky-600')
    }
    aria-label={to}
  >
    <i className={iconClass} />
  </Link>
);

export default function Sidebar() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAddBatch = location.pathname.startsWith('/batches');
  const isInventory = location.pathname.startsWith('/inventory');
  const isReceipts = location.pathname.startsWith('/receipts');

  return (
    <nav id="sidebar" className="flex flex-col items-center w-20 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-4 justify-between">
      <div className="flex flex-col items-center gap-6">
        <Link to="/" id="logo" className="flex items-center justify-center h-12 w-12 bg-sky-600 rounded-xl text-white font-bold text-2xl shadow-lg">
          7-5
        </Link>
        <div id="nav-links" className="flex flex-col items-center gap-4">
          <NavIcon to="/dashboard" iconClass="fa-solid fa-chart-pie fa-lg" active={isDashboard} />
          <NavIcon to="/pos" iconClass="fa-solid fa-cash-register fa-lg" active={location.pathname.startsWith('/pos')} />
          <NavIcon to="/batches/new" iconClass="fa-solid fa-plus-square fa-lg" active={isAddBatch} />
          <NavIcon to="/inventory" iconClass="fa-solid fa-boxes-stacked fa-lg" active={isInventory} />
          <NavIcon to="/receipts" iconClass="fa-solid fa-receipt fa-lg" active={isReceipts} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <span className="p-3 rounded-lg text-gray-500 hover:bg-sky-100 hover:text-sky-600 transition-all duration-300 cursor-pointer">
          <i className="fa-solid fa-gear fa-lg" />
        </span>
        <img
          src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
          alt="User Avatar"
          className="w-10 h-10 rounded-full border-2 border-white shadow-md"
        />
      </div>
    </nav>
  );
} 