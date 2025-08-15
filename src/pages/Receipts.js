import { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import TransactionRow from '../components/TransactionRow';

const rows = [
  {
    id: 'INV-20250808-001',
    date: '2025-08-08',
    time: '02:45 PM',
    invoice: 'INV-20250808-001',
    methodLabel: 'Cash',
    total: '$152.75',
    badge: 'Top Sales Day',
    items: [
      { name: 'Bell Pepper', qty: 2, unit: '$8.99', total: '$17.98' },
      { name: 'Avocado', qty: 5, unit: '$1.50', total: '$7.50' },
    ],
  },
  {
    id: 'INV-20250807-042',
    date: '2025-08-07',
    time: '11:10 AM',
    invoice: 'INV-20250807-042',
    methodLabel: 'Cash',
    total: '$33.24',
    items: [
      { name: 'Ensore Milk', qty: 1, unit: '$6.48', total: '$6.48' },
      { name: 'Banana', qty: 3, unit: '$0.59', total: '$1.77' },
    ],
  },
];

export default function Receipts() {
  const [dateRange, setDateRange] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [method, setMethod] = useState('cash');

  const filtered = useMemo(() => {
    const pf = productFilter.toLowerCase();
    return rows.filter((r) =>
      !pf || r.items.some((it) => it.name.toLowerCase().includes(pf))
    );
  }, [productFilter]);

  return (
    <PageLayout mainId="sales-history-page" mainClassName="flex flex-col overflow-hidden">
      <Header
        title="Sales History"
        subtitle="Review all past transactions and export reports."
        right={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm">
              <i className="fa-solid fa-file-csv text-green-600" />
              <span>Export CSV</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm">
              <i className="fa-solid fa-file-pdf text-red-600" />
              <span>Export PDF</span>
            </button>
          </div>
        }
      />

      <FilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        method={method}
        setMethod={setMethod}
      />

      <section id="sales-table-container" className="flex-1 flex flex-col bg-card-bg rounded-xl shadow-md overflow-hidden">
        <div id="sales-table-header" className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-border-light">
          <span className="col-span-1" />
          <span className="col-span-3 font-semibold text-text-secondary">Date & Time</span>
          <span className="col-span-3 font-semibold text-text-secondary">Invoice Number</span>
          <span className="col-span-2 font-semibold text-text-secondary">Payment Method</span>
          <span className="col-span-3 font-semibold text-text-secondary text-right">Total Amount</span>
        </div>
        <div id="sales-table-body" className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.map((r) => (
            <TransactionRow key={r.id} {...r} />
          ))}
        </div>
      </section>
    </PageLayout>
  );
} 