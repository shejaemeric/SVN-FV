export default function ActivityItem({ iconClass, iconBgClass, title, description, time }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconBgClass}`}>
        <i className={iconClass} />
      </div>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">
          {description} <span className="font-medium text-gray-600">{time}</span>
        </p>
      </div>
    </div>
  );
} 