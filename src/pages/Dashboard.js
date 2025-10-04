import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SummaryCard from '../components/SummaryCard';
import ChartCard from '../components/ChartCard';
import Card from '../components/Card';
import NotificationToast, { ErrorToast } from '../components/ErrorToast';

import MonthlySalesChart from '../charts/MonthlySalesChart';
import StockDistributionChart from '../charts/StockDistributionChart';
import TopSellingProductsChart from '../charts/TopSellingProductsChart';

import { productAPI, receiptAPI, salesAPI, stockAPI, supplierAPI, customerAPI } from '../services/api';
import { exportDashboardToPDF } from '../utils/exportUtils';
import { formatCurrencyWhole, formatNumberWithCommas } from '../utils/numberUtils';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    monthlyRevenue: 0,
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    cashSales: 0,
    customerSales: 0,
    products: [],
    receipts: [],
    sales: [],
    stocks: [],
    suppliers: [],
    customers: [],
    invoices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all data in parallel
      const [productsResponse, receiptsResponse, salesResponse, stocksResponse, suppliersResponse, customersResponse] = await Promise.all([
        productAPI.getAllProducts(),
        receiptAPI.getAllReceipts(),
        salesAPI.getAllSales(),
        stockAPI.getAllStocks(),
        supplierAPI.getAllSuppliers(),
        customerAPI.getAllCustomers(),
      ]);

      // Process products data
      const products = Array.isArray(productsResponse) ? productsResponse : (productsResponse.data || productsResponse.products || []);
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => (p.stock || 0) <= 5).length;

      // Process receipts data
      const receipts = Array.isArray(receiptsResponse) ? receiptsResponse : (receiptsResponse.data || receiptsResponse.receipts || []);
      
      // Process sales data
      const sales = Array.isArray(salesResponse) ? salesResponse : (salesResponse.data || salesResponse.sales || []);
      
      // Debug logging
      console.log('Dashboard Data Debug:', {
        receiptsCount: receipts.length,
        salesCount: sales.length,
        sampleReceipt: receipts[0],
        sampleSale: sales[0]
      });
      
      // Process stocks data
      const stocks = Array.isArray(stocksResponse) ? stocksResponse : (stocksResponse.data || stocksResponse.stocks || []);
      
      // Process suppliers data
      const suppliers = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse.data || suppliersResponse.suppliers || []);
      
      // Process customers data
      const customers = Array.isArray(customersResponse) ? customersResponse : (customersResponse.data || customersResponse.customers || []);
      
      // Process invoices data (empty for now as there's no getAllInvoices endpoint)
      const invoices = [];
      
      // Calculate total sales from all receipts
      const totalSales = receipts.reduce((sum, receipt) => {
        return sum + (receipt.total || 0);
      }, 0);

      // Calculate today's sales using actual dates
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const todaySales = receipts.reduce((sum, receipt) => {
        const receiptDate = receipt.created_at || receipt.date || receipt.timestamp;
        if (receiptDate) {
          const date = new Date(receiptDate);
          const receiptDateString = date.toISOString().split('T')[0];
          if (receiptDateString === todayString) {
            return sum + (receipt.total || 0);
          }
        }
        return sum;
      }, 0);

      // Calculate monthly revenue (current month)
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const monthlyRevenue = receipts.reduce((sum, receipt) => {
        const receiptDate = receipt.created_at || receipt.date || receipt.timestamp;
        if (receiptDate) {
          const date = new Date(receiptDate);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            return sum + (receipt.total || 0);
          }
        }
        return sum;
      }, 0);

      // Calculate sales statistics
      const totalTransactions = receipts.length;
      const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const cashSales = receipts.filter(r => !r.customer_id).reduce((sum, r) => sum + (r.total || 0), 0);
      const customerSales = receipts.filter(r => r.customer_id).reduce((sum, r) => sum + (r.total || 0), 0);


      setDashboardData({
        totalProducts,
        lowStockItems,
        todaySales,
        monthlyRevenue,
        totalSales,
        totalTransactions,
        averageOrderValue,
        cashSales,
        customerSales,
        products,
        receipts,
        sales,
        stocks,
        suppliers,
        customers,
        invoices
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper (now using utility function)
  const formatCurrency = formatCurrencyWhole;

  // Calculate top selling products from receipts and sales data
  const calculateTopSellingProducts = (receipts, sales) => {
    const productSales = {};
    
    // First, try to get data from receipts
    receipts.forEach(receipt => {
      if (receipt.sales && Array.isArray(receipt.sales)) {
        receipt.sales.forEach(sale => {
          const productName = sale.product_name || 'Unknown Product';
          if (!productSales[productName]) {
            productSales[productName] = 0;
          }
          productSales[productName] += sale.number || 0;
        });
      }
      
      // Also check if receipt has items array
      if (receipt.items && Array.isArray(receipt.items)) {
        receipt.items.forEach(item => {
          const productName = item.name || item.product_name || 'Unknown Product';
          if (!productSales[productName]) {
            productSales[productName] = 0;
          }
          productSales[productName] += item.quantity || item.qty || 0;
        });
      }
    });
    
    // If no data from receipts, try sales data
    if (Object.keys(productSales).length === 0 && sales && Array.isArray(sales)) {
      sales.forEach(sale => {
        const productName = sale.product_name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = 0;
        }
        productSales[productName] += sale.number || sale.quantity || 0;
      });
    }
    
    // Sort and get top 5
    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value: value
      }));
    
    return topProducts;
  };

  // Calculate stock distribution from stocks and products data
  const calculateStockDistribution = (stocks, products) => {
    const stockData = { inStock: 0, lowStock: 0, outOfStock: 0 };
    
    // First try to use stocks data if available
    if (stocks && stocks.length > 0) {
      stocks.forEach(stock => {
        const currentQuantity = stock.current_number || stock.current_quantity || 0;
        if (currentQuantity === 0) {
          stockData.outOfStock++;
        } else if (currentQuantity <= 5) {
          stockData.lowStock++;
        } else {
          stockData.inStock++;
        }
      });
    } else if (products && products.length > 0) {
      // Fallback to products data
      products.forEach(product => {
        const stock = product.stock || 0;
        if (stock === 0) {
          stockData.outOfStock++;
        } else if (stock <= 5) {
          stockData.lowStock++;
        } else {
          stockData.inStock++;
        }
      });
    }
    
    const totalItems = stockData.inStock + stockData.lowStock + stockData.outOfStock;
    
    if (totalItems === 0) {
      return [
        { name: 'No Stock Data', value: 100, color: '#E9ECEF' }
      ];
    }
    
    return [
      { 
        name: 'In Stock', 
        value: Math.round((stockData.inStock / totalItems) * 100), 
        color: '#28A745' 
      },
      { 
        name: 'Low Stock', 
        value: Math.round((stockData.lowStock / totalItems) * 100), 
        color: '#FFC107' 
      },
      { 
        name: 'Out of Stock', 
        value: Math.round((stockData.outOfStock / totalItems) * 100), 
        color: '#DC3545' 
      },
    ];
  };

  // Handle dashboard export
  const handleExportDashboard = async () => {
    try {
      // Prepare chart data for export
      const chartsData = [
        {
          title: 'Monthly Sales Chart',
          type: 'area',
          data: dashboardData.receipts.map(receipt => ({
            total: receipt.total || 0,
            date: receipt.created_at || receipt.date || receipt.timestamp
          }))
        },
        {
          title: 'Stock Distribution Chart',
          type: 'pie',
          data: calculateStockDistribution(dashboardData.stocks, dashboardData.products)
        },
        {
          title: 'Top Selling Products Chart',
          type: 'bar',
          data: calculateTopSellingProducts(dashboardData.receipts, dashboardData.sales)
        }
      ];

      // Add summary statistics with enhanced data
      chartsData.summary = [
        { label: 'Total Products', value: formatNumberWithCommas(dashboardData.totalProducts) },
        { label: 'Low Stock Items', value: formatNumberWithCommas(dashboardData.lowStockItems) },
        { label: "Today's Sales", value: formatCurrency(dashboardData.todaySales) },
        { label: 'Monthly Revenue', value: formatCurrency(dashboardData.monthlyRevenue) },
        { label: 'Total Sales (All Time)', value: formatCurrency(dashboardData.totalSales) },
        { label: 'Total Transactions', value: formatNumberWithCommas(dashboardData.totalTransactions) },
        { label: 'Average Order Value', value: formatCurrency(dashboardData.averageOrderValue) },
        { label: 'Cash Sales', value: formatCurrency(dashboardData.cashSales) },
        { label: 'Customer Sales', value: formatCurrency(dashboardData.customerSales) }
      ];

      await exportDashboardToPDF(chartsData, 'Dashboard Report', `dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('Dashboard exported successfully!');
    } catch (err) {
      console.error('Dashboard export error:', err);
      setError('Failed to export dashboard. Please try again.');
    }
  };

  if (loading) {
    return (
      <div id="pos-system" className="flex min-h-[950px] gap-4">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main id="dashboard-page" className="flex-1 flex flex-col gap-6 bg-light-bg/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 overflow-y-auto">
          <Header title="Dashboard" subtitle="Loading..." />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading dashboard data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <ErrorToast error={error} onClose={() => setError('')} />
      <NotificationToast 
        message={success} 
        type="success" 
        onClose={() => setSuccess('')} 
        autoClose={true} 
      />
      <div id="pos-system" className="flex min-h-[950px] gap-4">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main id="dashboard-page" className="flex-1 flex flex-col gap-6 bg-light-bg/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 overflow-y-auto">
          <Header 
            title="Dashboard" 
            subtitle="Welcome back, here's your stock and sales overview."
            right={
              <button 
                onClick={handleExportDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors shadow-sm"
              >
                <i className="fa-solid fa-file-pdf text-red-600" />
                <span>Export Dashboard</span>
              </button>
            }
          />

          {/* Summary Cards - 4 Cards Maximum */}
          <section id="summary-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-section="summary-cards">
            <SummaryCard
              title="Total Products"
              value={formatNumberWithCommas(dashboardData.totalProducts)}
              gradientFrom="from-cyan-400"
              gradientTo="to-sky-500"
              iconClass="fa-solid fa-box-open"
              backgroundIconClass="fa-solid fa-boxes-stacked"
              subtitleClass="text-sky-100"
            />
            <SummaryCard
              title="Low Stock Items"
              value={formatNumberWithCommas(dashboardData.lowStockItems)}
              gradientFrom="from-yellow-400"
              gradientTo="to-orange-500"
              iconClass="fa-solid fa-battery-quarter"
              backgroundIconClass="fa-solid fa-exclamation-triangle"
              subtitleClass="text-orange-100"
            />
            <SummaryCard
              title="Today's Sales"
              value={formatCurrency(dashboardData.todaySales)}
              gradientFrom="from-green-400"
              gradientTo="to-teal-500"
              iconClass="fa-solid fa-cash-register"
              backgroundIconClass="fa-solid fa-dollar-sign"
              subtitleClass="text-teal-100"
            />
            <SummaryCard
              title="Monthly Revenue"
              value={formatCurrency(dashboardData.monthlyRevenue)}
              gradientFrom="from-purple-400"
              gradientTo="to-indigo-500"
              iconClass="fa-solid fa-wallet"
              backgroundIconClass="fa-solid fa-chart-line"
              subtitleClass="text-indigo-100"
            />
          </section>

          {/* Additional Metrics Display */}
          <section id="additional-metrics" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Business Overview</h3>
                <i className="fa-solid fa-chart-pie text-brand-blue text-xl"></i>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Suppliers</span>
                  <span className="font-semibold text-text-primary">{formatNumberWithCommas(dashboardData.suppliers.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Customers</span>
                  <span className="font-semibold text-text-primary">{formatNumberWithCommas(dashboardData.customers.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Stock Entries</span>
                  <span className="font-semibold text-text-primary">{formatNumberWithCommas(dashboardData.stocks.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Transactions</span>
                  <span className="font-semibold text-text-primary">{formatNumberWithCommas(dashboardData.totalTransactions)}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Quick Stats</h3>
                <i className="fa-solid fa-chart-bar text-status-green text-xl"></i>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Avg. Order Value</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(dashboardData.totalTransactions > 0 ? dashboardData.monthlyRevenue / dashboardData.totalTransactions : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Stock Utilization</span>
                  <span className="font-semibold text-text-primary">
                    {dashboardData.totalProducts > 0 ? Math.round((dashboardData.totalProducts - dashboardData.lowStockItems) / dashboardData.totalProducts * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Growth Rate</span>
                  <span className="font-semibold text-status-green">+12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Active Users</span>
                  <span className="font-semibold text-text-primary">{formatNumberWithCommas(dashboardData.customers.length)}</span>
                </div>
              </div>
            </Card>

          </section>

          {/* Charts & Graphs */}
          <section id="charts-and-graphs" className="grid grid-cols-1 lg:grid-cols-5 gap-6" data-section="charts-and-graphs">
            <ChartCard title="Monthly Sales" className="lg:col-span-3" data-chart="monthly-sales">
              <MonthlySalesChart receipts={dashboardData.receipts} />
            </ChartCard>
            <ChartCard title="Stock Level Distribution" className="lg:col-span-2" data-chart="stock-distribution">
              <StockDistributionChart products={dashboardData.products} />
            </ChartCard>
          </section>

          {/* Bottom Section: Top Products */}
          <section id="bottom-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-section="bottom-section">
            <ChartCard title="Top Selling Products" className="lg:col-span-3" data-chart="top-products">
              <TopSellingProductsChart receipts={dashboardData.receipts} />
            </ChartCard>
          </section>
        </main>
      </div>
    </>
  );
}
