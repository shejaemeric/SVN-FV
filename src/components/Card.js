export default function Card({ title, children, className = '', bodyClassName = '' }) {
  return (
    <div className={`bg-card-bg p-6 rounded-2xl shadow-sm ${className}`}>
      {title ? <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3> : null}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
} 