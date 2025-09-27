import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

const StockDistributionChart = ({ products = [] }) => {
  // Calculate stock distribution from products
  const stockData = products.reduce((acc, product) => {
    const stock = product.stock || 0;
    if (stock === 0) {
      acc.outOfStock++;
    } else if (stock <= 5) {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    return acc;
  }, { inStock: 0, lowStock: 0, outOfStock: 0 });

  const totalProducts = products.length;
  const data = [
    { 
      name: 'In Stock', 
      y: totalProducts > 0 ? Math.round((stockData.inStock / totalProducts) * 100) : 0, 
      color: '#28A745' 
    },
    { 
      name: 'Low Stock', 
      y: totalProducts > 0 ? Math.round((stockData.lowStock / totalProducts) * 100) : 0, 
      color: '#FFC107' 
    },
    { 
      name: 'Out of Stock', 
      y: totalProducts > 0 ? Math.round((stockData.outOfStock / totalProducts) * 100) : 0, 
      color: '#DC3545' 
    },
  ];

  const options = Highcharts.merge(commonOptions, {
    chart: { type: 'pie' },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: true,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        innerSize: '60%',
      },
    },
    series: [
      {
        name: 'Stock Status',
        colorByPoint: true,
        data: data,
      },
    ],
  });

  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
};

export default StockDistributionChart; 