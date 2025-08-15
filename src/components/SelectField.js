export default function SelectField({ id, value, onChange, options = [], className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  );
} 