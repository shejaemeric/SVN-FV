import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddBatch from './pages/AddBatch';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Receipts from './pages/Receipts';
import './App.css';

function App() {
  return (
    <div className="bg-gradient-to-r from-gray-300 to-gray-100 font-poppins antialiased min-h-screen p-4">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/batches/new" element={<AddBatch />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/receipts" element={<Receipts />} />
        {/* Add more routes here when needed */}
      </Routes>
    </div>
  );
}

export default App;
