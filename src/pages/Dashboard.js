import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SummaryCard from '../components/SummaryCard';
import ChartCard from '../components/ChartCard';
import ActivityItem from '../components/ActivityItem';

import MonthlySalesChart from '../charts/MonthlySalesChart';
import StockDistributionChart from '../charts/StockDistributionChart';
import TopSellingProductsChart from '../charts/TopSellingProductsChart';

export default function Dashboard() {
  return (
    <div id="pos-system" className="flex min-h-[950px] gap-4">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main id="dashboard-page" className="flex-1 flex flex-col gap-6 bg-light-bg/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 overflow-y-auto">
        <Header title="Dashboard" subtitle="Welcome back, here's your stock and sales overview." />

        {/* Summary Cards */}
        <section id="summary-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Products"
            value="12,320"
            gradientFrom="from-cyan-400"
            gradientTo="to-sky-500"
            iconClass="fa-solid fa-box-open"
            backgroundIconClass="fa-solid fa-boxes-stacked"
            subtitleClass="text-sky-100"
          />
          <SummaryCard
            title="Items Low in Stock"
            value="87"
            gradientFrom="from-yellow-400"
            gradientTo="to-orange-500"
            iconClass="fa-solid fa-battery-quarter"
            backgroundIconClass="fa-solid fa-exclamation-triangle"
            subtitleClass="text-orange-100"
          />
          <SummaryCard
            title={"Today's Sales"}
            value="$1,482.50"
            gradientFrom="from-green-400"
            gradientTo="to-teal-500"
            iconClass="fa-solid fa-cash-register"
            backgroundIconClass="fa-solid fa-dollar-sign"
            subtitleClass="text-teal-100"
          />
          <SummaryCard
            title="Monthly Revenue"
            value="$45,980"
            gradientFrom="from-purple-400"
            gradientTo="to-indigo-500"
            iconClass="fa-solid fa-wallet"
            backgroundIconClass="fa-solid fa-chart-line"
            subtitleClass="text-indigo-100"
          />
        </section>

        {/* Charts & Graphs */}
        <section id="charts-and-graphs" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <ChartCard title="Monthly Sales" className="lg:col-span-3">
            <MonthlySalesChart />
          </ChartCard>
          <ChartCard title="Stock Level Distribution" className="lg:col-span-2">
            <StockDistributionChart />
          </ChartCard>
        </section>

        {/* Bottom Section: Top Products & Recent Activity */}
        <section id="bottom-section" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <ChartCard title="Top Selling Products" className="lg:col-span-3">
            <TopSellingProductsChart />
          </ChartCard>
          <div id="recent-activity-card" className="lg:col-span-2 bg-card-bg p-6 rounded-2xl shadow-md flex flex-col">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Recent Activity</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <ActivityItem iconClass="fa-solid fa-plus text-status-green" iconBgClass="bg-green-100" title="New product added" description={'"Organic Bananas" was added to the inventory.'} time="5m ago" />
              <ActivityItem iconClass="fa-solid fa-arrow-up text-brand-blue" iconBgClass="bg-sky-100" title="Large Transaction" description={'Sale #TXN7890 for $245.50 completed.'} time="30m ago" />
              <ActivityItem iconClass="fa-solid fa-sync-alt text-status-yellow" iconBgClass="bg-yellow-100" title="Stock Updated" description={'50 units of "Ensore Milk" restocked.'} time="1h ago" />
              <ActivityItem iconClass="fa-solid fa-arrow-down text-status-red" iconBgClass="bg-red-100" title="Stock Alert" description={'"Avocado" is now low in stock (5 items left).'} time="2h ago" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 