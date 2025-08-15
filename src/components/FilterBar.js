import FormField from './FormField';
import SelectField from './SelectField';

export default function FilterBar({ dateRange, setDateRange, productFilter, setProductFilter, method, setMethod }) {
  return (
    <section id="filters-section" className="flex items-center gap-4 mb-4">
      <div className="relative flex-grow">
        <i className="fa-solid fa-calendar-day absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <FormField
          id="date-range"
          placeholder="Select Date Range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          inputProps={{ className: 'w-full pl-12 pr-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow' }}
        />
      </div>
      <div className="relative">
        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <FormField
          id="product-filter"
          placeholder="Filter by Product..."
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          inputProps={{ className: 'w-64 pl-12 pr-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow' }}
        />
      </div>
      <SelectField
        id="payment-method"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        options={[{ value: 'cash', label: 'Cash on Hand' }]}
        className="w-56"
      />
    </section>
  );
} 