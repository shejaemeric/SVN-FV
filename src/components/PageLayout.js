import Sidebar from './Sidebar';

export default function PageLayout({ mainId, children, mainClassName = '' }) {
  return (
    <div id="pos-system" className="flex min-h-[950px] gap-4">
      <Sidebar />
      <main id={mainId} className={`flex-1 bg-light-bg/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 overflow-y-auto ${mainClassName}`}>
        {children}
      </main>
    </div>
  );
} 