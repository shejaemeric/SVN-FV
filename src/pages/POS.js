import { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import ProductListHeader from '../components/ProductListHeader';
import ProductListItem from '../components/ProductListItem';
import PriceRow from '../components/PriceRow';
import FormField from '../components/FormField';
import ReceiptItemRow from '../components/ReceiptItemRow';

const initialItems = [
  {
    id: 'BP456',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f0a28537af-fa132c7bdcc01ce5c166.png',
    name: 'Bell Pepper',
    sku: 'BP456',
    quantity: 2,
    unitPrice: 8.99,
  },
  {
    id: 'EM789',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/e1ec45208e-0aee2c72d902bd1e4ad5.png',
    name: 'Ensore Milk',
    sku: 'EM789',
    quantity: 1,
    unitPrice: 6.48,
  },
  {
    id: 'AV101',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/f0a28537af-0d042c574537cbca2371.png',
    name: 'Avocado',
    sku: 'AV101',
    quantity: 5,
    unitPrice: 1.5,
  },
  {
    id: 'BN212',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/51a8380bc2-d1b4039be0b23eca6989.png',
    name: 'Banana',
    sku: 'BN212',
    quantity: 3,
    unitPrice: 0.59,
  },
];

export default function POS() {
  const [items, setItems] = useState(initialItems);
  const [scan, setScan] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    [items]
  );
  const taxes = useMemo(() => subtotal * 0.08, [subtotal]);
  const discount = useMemo(() => (discountCode ? 5 : 0), [discountCode]);
  const total = useMemo(() => subtotal + taxes - discount, [subtotal, taxes, discount]);

  const updateQty = (id, qty) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(0, qty) } : it)));
  };
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const clearCart = () => setItems([]);

  return (
    <PageLayout mainId="cashier-page" mainClassName="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
      {/* Left Panel: Product Scanning & List */}
      <section id="product-panel" className="lg:col-span-2 flex flex-col h-full min-h-0">
        <Header title="Point of Sale" subtitle="Scan products to add them to the cart" right={null} />

        <div id="barcode-scanner" className="relative mb-4">
          <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <FormField
            id="scanner"
            placeholder="Scan barcode or type product code..."
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            inputProps={{ className: 'w-full pl-12 pr-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow' }}
          />
        </div>

        <ProductListHeader />
        <div id="product-list" className="flex-1 space-y-3 pr-2 overflow-y-auto min-h-0">
          {items.map((it) => (
            <ProductListItem
              key={it.id}
              image={it.image}
              name={it.name}
              sku={it.sku}
              quantity={it.quantity}
              unitPrice={it.unitPrice}
              onQuantityChange={(q) => updateQty(it.id, q)}
              onRemove={() => removeItem(it.id)}
            />
          ))}
        </div>
      </section>

      {/* Right Panel: Checkout */}
      <aside id="checkout-panel" className="lg:col-span-1 bg-white rounded-2xl shadow-lg flex flex-col p-6 min-h-0">
        <h2 className="text-xl font-bold text-text-primary mb-4">Order Summary</h2>

        {/* Receipt-style container */}
        <div className="bg-gray-50 border border-border-light rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-secondary">Items</p>
            <p className="text-xs text-text-secondary">{items.length} total</p>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-text-secondary text-sm">No items in cart.</p>
            ) : (
              items.map((it) => (
                <ReceiptItemRow key={it.id} name={it.name} quantity={it.quantity} unitPrice={it.unitPrice} />
              ))
            )}
          </div>
        </div>

        <div id="price-calculation" className="space-y-2.5 text-text-primary">
          <PriceRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          <PriceRow label="Taxes (8%)" value={`$${taxes.toFixed(2)}`} />
          <PriceRow label="Discount" value={`-${discount ? `$${discount.toFixed(2)}` : '$0.00'}`} valueClassName="text-status-green" />
          <div className="border-t border-dashed border-border-light my-3" />
          <div className="flex justify-between items-center text-2xl font-bold">
            <p>Total</p>
            <p className="font-mono">${total.toFixed(2)}</p>
          </div>
        </div>

        <div id="discount-section" className="my-4">
          <label htmlFor="discount-code" className="text-sm font-medium text-text-secondary block mb-2">Discount Code</label>
          <div className="flex gap-2">
            <input
              id="discount-code"
              type="text"
              placeholder="Enter code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-1 bg-gray-100 border border-transparent rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button className="bg-blue-100 text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
              Apply
            </button>
          </div>
        </div>

        <div id="payment-method" className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Payment Method</h3>
          <div className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-xl">
            <i className="fa-solid fa-money-bill-wave text-blue-600 fa-lg mr-4" />
            <div>
              <p className="font-semibold text-blue-800">Cash on Hand</p>
              <p className="text-sm text-blue-600">Pay with cash at checkout.</p>
            </div>
          </div>
        </div>

        <div id="quick-actions" className="mt-auto space-y-3">
          <div className="flex gap-3">
            <button onClick={clearCart} className="w-full flex items-center justify-center gap-2 py-3 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-200 transition-colors">
              <i className="fa-solid fa-times-circle" /> Clear Cart
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors">
              <i className="fa-solid fa-print" /> Print
            </button>
          </div>
          <button id="checkout-button" className="w-full py-4 bg-sky-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
            <i className="fa-solid fa-lock mr-2" /> Complete Purchase
          </button>
        </div>
      </aside>
    </PageLayout>
  );
} 