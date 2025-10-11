export default function SummaryCard({
  title,
  value,
  gradientFrom,
  gradientTo,
  iconClass,
  backgroundIconClass,
  subtitleClass = '',
  subtitle = ''
}) {
  // Extract color from gradientFrom for border and accent colors
  const colorMap = {
    'from-cyan-400': { border: 'border-cyan-100', accent: 'text-cyan-600', bg: 'from-cyan-500/10 to-cyan-600/5', iconFrom: 'from-cyan-500', iconTo: 'to-cyan-600' },
    'from-yellow-400': { border: 'border-orange-100', accent: 'text-orange-600', bg: 'from-orange-500/10 to-orange-600/5', iconFrom: 'from-orange-500', iconTo: 'to-orange-600' },
    'from-green-400': { border: 'border-emerald-100', accent: 'text-emerald-600', bg: 'from-emerald-500/10 to-emerald-600/5', iconFrom: 'from-emerald-500', iconTo: 'to-emerald-600' },
    'from-purple-400': { border: 'border-purple-100', accent: 'text-purple-600', bg: 'from-purple-500/10 to-purple-600/5', iconFrom: 'from-purple-500', iconTo: 'to-purple-600' },
  };
  
  const colors = colorMap[gradientFrom] || { border: 'border-blue-100', accent: 'text-blue-600', bg: 'from-blue-500/10 to-blue-600/5', iconFrom: 'from-blue-500', iconTo: 'to-blue-600' };

  return (
    <div className={`group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border ${colors.border}`}>
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${colors.bg} rounded-full -mr-14 -mt-14`}></div>
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colors.iconFrom} ${colors.iconTo} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <i className={`${iconClass} text-white text-xl`}></i>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        </div>
        <p className="text-3xl font-semibold text-gray-700">{value}</p>
        <p className={`text-xs font-medium mt-2 ${colors.accent}`}>
          {subtitle || 'Current status'}
        </p>
      </div>
    </div>
  );
} 