export default function ProductListItem({
  image,
  name,
  sku,
  quantity,
  unitPrice,
  onQuantityChange,
  onRemove,
}) {
  const total = (Number(unitPrice) * Number(quantity)).toFixed(2);
  return (
    <div className="grid grid-cols-12 items-center gap-4 bg-card-bg p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="col-span-4 flex items-center gap-4">
{/*         <img className="w-12 h-12 rounded-lg object-cover" src={image} alt={name} />
 */}        <div>
          <h3 className="font-semibold text-text-primary">{name}</h3>
{/*           <p className="text-sm text-text-secondary">SKU: {sku}</p>
 */}        
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center gap-2">
        <input
          type="number"
          value={quantity}
          min={0}
          onChange={(e) => onQuantityChange?.(Number(e.target.value))}
          className="w-14 text-center bg-gray-100 rounded-md py-1 border border-transparent focus:ring-1 focus:ring-sky-500 focus:outline-none"
        />
      </div>
      <p className="col-span-3 text-right font-medium text-text-primary">RWF {Number(unitPrice).toFixed(0)}</p>
      <div className="col-span-3 flex items-center justify-end gap-3">
        <p className="font-semibold text-green-600">RWF {Number(total).toFixed(0)}</p>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors" aria-label={`Remove ${name}`}>
          <i className="fa-solid fa-trash-alt" />
        </button>
      </div>
    </div>
  );
} 