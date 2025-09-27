import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

const TopSellingProductsChart = ({ receipts = [] }) => {
  // Calculate top selling products from receipts
  const productSales = {};
  
  receipts.forEach(receipt => {
    if (receipt.sales) {
      receipt.sales.forEach(sale => {
        const productName = sale.product_name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = 0;
        }
        productSales[productName] += sale.number || 0;
      });
    }
  });

  // Sort products by sales and get top 5
  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const categories = topProducts.map(([name]) => name);
  const data = topProducts.map(([, sales]) => sales);

  const options = Highcharts.merge(commonOptions, {
    chart: { type: 'bar' },
    xAxis: {
      categories: categories,
      labels: { style: { color: '#6C757D' } },
      lineColor: '#E9ECEF',
    },
    yAxis: {
      min: 0,
      title: { text: 'Units Sold', style: { color: '#6C757D' } },
      labels: { style: { color: '#6C757D' } },
      gridLineColor: '#E9ECEF',
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        pointWidth: 20,
        dataLabels: {
          enabled: true,
          style: { color: '#212529', textOutline: 'none' },
        },
      },
    },
    series: [
      {
        name: 'Units Sold',
        data: data,
        color: '#20A8CE',
        showInLegend: false,
      },
    ],
  });

  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
};

export default TopSellingProductsChart; 