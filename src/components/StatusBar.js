export default function StatusBar({ label, colorClass, barColorClass, percent }) {
  return (
    <div className="text-center">
      <span className={`font-semibold ${colorClass}`}>{label}</span>
      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1 mx-auto">
        <div className={`${barColorClass} h-1.5 rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
} 