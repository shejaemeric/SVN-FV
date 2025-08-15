export default function PriceRow({ label, value, valueClassName = '' }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <p className="text-text-secondary">{label}</p>
      <p className={`font-medium font-mono ${valueClassName}`}>{value}</p>
    </div>
  );
} 