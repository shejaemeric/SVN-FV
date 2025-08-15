import StatusBar from './StatusBar';

export default function ProductRow({
  image,
  name,
  sku,
  statusLabel,
  statusColorClass,
  statusPercent,
  price,
  onEdit,
  onView,
  onDelete,
}) {
  const barColorClass =
    statusColorClass === 'text-status-green'
      ? 'bg-status-green'
      : statusColorClass === 'text-status-yellow'
      ? 'bg-status-yellow'
      : 'bg-status-red';

  return (
    <div className="grid grid-cols-12 items-center gap-4 bg-card-bg p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="col-span-5 flex items-center gap-4">
        <img className="w-14 h-14 rounded-lg object-cover" src={image} alt={name} />
        <div>
          <h3 className="font-semibold text-text-primary">{name}</h3>
          <p className="text-sm text-text-secondary">SKU: {sku}</p>
        </div>
      </div>
      <div className="col-span-2 text-center">
        <StatusBar label={statusLabel} colorClass={statusColorClass} barColorClass={barColorClass} percent={statusPercent} />
      </div>
      <div className="col-span-2 text-right font-medium text-lg text-text-primary">${price}</div>
      <div className="col-span-3 flex justify-center items-center gap-3">
        <button onClick={onEdit} className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-colors">
          <i className="fa-solid fa-pen" />
        </button>
        <button onClick={onView} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors">
          <i className="fa-solid fa-eye" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
          <i className="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  );
} 