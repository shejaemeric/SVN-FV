export default function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-card-bg p-6 rounded-2xl shadow-md ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
} 