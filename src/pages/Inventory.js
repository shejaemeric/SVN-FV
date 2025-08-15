import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import TableHeaderRow from '../components/TableHeaderRow';
import ProductRow from '../components/ProductRow';
import Modal from '../components/Modal';

const products = [
  {
    id: 'BP456',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f0a28537af-fa132c7bdcc01ce5c166.png',
    name: 'Bell Pepper',
    sku: 'BP456',
    statusLabel: 'In Stock',
    statusColorClass: 'text-status-green',
    statusPercent: 85,
    price: '8.99',
    onShelf: '22/35',
    totalInventory: 196,
  },
  {
    id: 'AV101',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f0a28537af-0d042c574537cbca2371.png',
    name: 'Avocado',
    sku: 'AV101',
    statusLabel: 'Low Stock',
    statusColorClass: 'text-status-yellow',
    statusPercent: 15,
    price: '1.50',
    onShelf: '5/30',
    totalInventory: 53,
  },
  {
    id: 'OM555',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/e1ec45208e-0aee2c72d902bd1e4ad5.png',
    name: 'Organic Milk',
    sku: 'OM555',
    statusLabel: 'Out of Stock',
    statusColorClass: 'text-status-red',
    statusPercent: 2,
    price: '6.48',
    onShelf: '0/24',
    totalInventory: 0,
  },
];

export default function Inventory() {
  const [query, setQuery] = useState('');
  const [viewProduct, setViewProduct] = useState(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [query]);

  return (
    <PageLayout mainId="inventory-management-page" mainClassName="flex flex-col overflow-hidden">
      <Header
        title="Products Management"
        subtitle="125 products - 12,320 items total"
        right={
          <div className="flex items-center gap-3">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search product..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 pl-11 pr-4 py-2.5 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
              />
            </div>
            <button className="px-4 py-2.5 bg-white border border-border-light text-text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-filter mr-2" /> Filters
            </button>
            <button onClick={() => navigate('/batches/new')} className="px-5 py-2.5 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-600 transition-all transform hover:scale-105">
              Create
            </button>
          </div>
        }
      />

      <div id="product-table-container" className="flex-1 overflow-y-auto">
        <TableHeaderRow />
        <div id="product-list" className="space-y-3">
          {filtered.map((p) => (
            <ProductRow
              key={p.id}
              image={p.image}
              name={p.name}
              sku={p.sku}
              statusLabel={p.statusLabel}
              statusColorClass={p.statusColorClass}
              statusPercent={p.statusPercent}
              price={p.price}
              onEdit={() => {}}
              onView={() => setViewProduct(p)}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>

      <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)}>
        {viewProduct && (
          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img className="w-20 h-20 rounded-xl object-cover" src={viewProduct.image} alt={viewProduct.name} />
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{viewProduct.name}</h2>
                  <p className="text-text-secondary">ID: {viewProduct.sku}</p>
                  <p className="text-xl font-semibold text-sky-600 mt-1">${viewProduct.price}</p>
                </div>
              </div>
              <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times fa-lg" />
              </button>
            </div>

            <div className="my-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-sky-50 p-4 rounded-lg">
                <p className="text-sm text-sky-500">On Shelf</p>
                <p className="text-2xl font-bold text-sky-800">{viewProduct.onShelf}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-500">Total Inventory</p>
                <p className="text-2xl font-bold text-green-800">{viewProduct.totalInventory}</p>
              </div>
            </div>

            <div id="modal-details" className="space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Sales History</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p>
                    Last 30 days: <span className="font-bold">3,213 units</span>{' '}
                    <span className="text-status-green">(+9%)</span>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Supplier Information</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p>
                    Name: <span className="font-bold">Fresh Farms Inc.</span>
                  </p>
                  <p>
                    Contact: <span className="font-bold">contact@freshfarms.com</span>
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-6 w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-600 transition-all">
              <i className="fa-solid fa-edit mr-2" /> Edit Full Details
            </button>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
} 