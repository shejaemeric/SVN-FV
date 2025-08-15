export default function StatusBar({ label, colorClass, barColorClass, percent }) {
  return (
    <div className="text-center">
      <span className={`font-semibold ${colorClass}`}>{label}</span>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div className={`${barColorClass} h-1.5 rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
} 