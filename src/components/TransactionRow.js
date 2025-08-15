import { useState } from 'react';

export default function TransactionRow({
  id,
  date,
  time,
  invoice,
  methodIconClass = 'fa-solid fa-money-bill-wave text-green-500',
  methodLabel = 'Cash',
  total,
  badge,
  items = [],
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`transaction-row ${open ? 'expanded' : ''}`}>
      <div
        className="grid grid-cols-12 items-center gap-4 px-4 py-3 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors duration-200"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="col-span-1 text-center text-text-secondary">
          <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
        <div className="col-span-3">
          <p className="font-medium text-text-primary">
            {date} <span className="text-text-secondary">{time}</span>
          </p>
          {badge ? (
            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="col-span-3 font-mono text-text-secondary">{invoice}</p>
        <div className="col-span-2 flex items-center gap-2">
          <i className={methodIconClass} />
          <span className="text-text-primary">{methodLabel}</span>
        </div>
        <p className="col-span-3 text-right font-bold text-lg text-text-primary">{total}</p>
      </div>
      <div className={`pl-16 pr-6 py-3 bg-gray-50/50 ${open ? '' : 'hidden'}`}>
        <div className="border-t border-border-light pt-3 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-8 gap-4 text-sm">
              <p className="col-span-4 text-text-secondary font-medium">{it.name} (x{it.qty})</p>
              <p className="col-span-2 text-text-secondary">{it.unit}</p>
              <p className="col-span-2 text-right text-text-primary font-medium">{it.total}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 