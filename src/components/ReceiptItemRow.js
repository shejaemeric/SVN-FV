export default function ReceiptItemRow({ name, quantity, unitPrice }) {
  const lineTotal = (Number(quantity) * Number(unitPrice)).toFixed(2);
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-border-light last:border-b-0">
      <div className="pr-2 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate" title={name}>{name}</p>
        <p className="text-xs text-text-secondary">{quantity} x ${Number(unitPrice).toFixed(2)}</p>
      </div>
      <p className="text-text-primary font-semibold font-mono">${lineTotal}</p>
    </div>
  );
} 