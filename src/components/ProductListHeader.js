export default function ProductListHeader() {
  return (
    <div id="product-list-header" className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-text-secondary">
      <span className="col-span-6">Product</span>
      <span className="col-span-2 text-center">Quantity</span>
      <span className="col-span-2 text-right">Unit Price</span>
      <span className="col-span-2 text-right">Total</span>
    </div>
  );
} 