export function Header({ title, subtitle, right }) {
  return (
    <header id="header" className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-text-secondary">{subtitle}</p>
        )}
      </div>
      {right === undefined ? (
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
            <i className="fa-solid fa-calendar-alt" />
            <span>Last 30 Days</span>
            <i className="fa-solid fa-chevron-down text-xs" />
          </button>
          <button className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 transition-all">
            <i className="fa-solid fa-file-export mr-2" />
            Export Report
          </button>
        </div>
      ) : right}
    </header>
  );
}

export default Header; 