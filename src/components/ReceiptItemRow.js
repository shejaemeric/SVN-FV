export default function ReceiptItemRow({ item, name, quantity, unitPrice }) {
  // Handle both prop patterns: item object or individual props
  const productName = name || item?.name || 'Unknown Product';
  const productQuantity = quantity || item?.quantity || 0;
  const productUnitPrice = unitPrice || item?.unitPrice || 0;
  
  const lineTotal = (Number(productQuantity) * Number(productUnitPrice)).toFixed(2);
  
  return (
    <div className="flex items-start justify-between py-1.5 px-6 border-b border-border-light last:border-b-0">
      <div className="pr-2 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate" title={productName}>{productName}</p>
        <p className="text-xs text-text-secondary">{productQuantity} x RWF {Number(productUnitPrice).toFixed(0)}</p>
      </div>
      <p className="text-text-primary font-semibold font-mono">RWF {Number(lineTotal).toFixed(0)}</p>
    </div>
  );
} 