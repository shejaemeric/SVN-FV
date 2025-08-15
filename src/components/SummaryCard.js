export default function SummaryCard({
  title,
  value,
  gradientFrom,
  gradientTo,
  iconClass,
  backgroundIconClass,
  subtitleClass = '',
}) {
  return (
    <div className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} p-6 rounded-2xl shadow-lg text-white overflow-hidden transition-transform duration-300 hover:-translate-y-1`}>
      {backgroundIconClass && (
        <i className={`${backgroundIconClass} absolute -right-4 -bottom-4 text-white/20 text-8xl`} />
      )}
      <div className="relative">
        <div className="flex items-center justify-center w-12 h-12 bg-white/30 rounded-xl mb-4">
          <i className={`${iconClass} text-2xl text-white`} />
        </div>
        <h3 className={`text-lg font-medium ${subtitleClass}`}>{title}</h3>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
} 