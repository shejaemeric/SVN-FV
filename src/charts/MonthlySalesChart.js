import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

const MonthlySalesChart = ({ receipts = [] }) => {
  // Debug: Log receipt data to see what we're working with
  console.log('MonthlySalesChart - Receipts data:', receipts);
  if (receipts.length > 0) {
    console.log('Sample receipt:', receipts[0]);
  }
  
  // Calculate sales data from receipts using actual dates
  const salesData = receipts.reduce((acc, receipt) => {
    const total = receipt.total || 0;
    
    // Try to get date from different possible fields
    const dateString = receipt.created_at || receipt.date || receipt.timestamp || receipt.created_date;
    
    if (dateString) {
      try {
        const date = new Date(dateString);
        const monthIndex = date.getMonth(); // 0-11 for Jan-Dec
        
        // Only process if it's a valid date and within current year
        if (!isNaN(date.getTime()) && date.getFullYear() === new Date().getFullYear()) {
          acc[monthIndex] = (acc[monthIndex] || 0) + total;
        }
      } catch (error) {
        console.warn('Invalid date format in receipt:', dateString, error);
      }
    }
    
    return acc;
  }, new Array(12).fill(0));

  const options = Highcharts.merge(commonOptions, {
    chart: { type: 'area' },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { color: '#6C757D' } },
      lineColor: '#E9ECEF',
      tickColor: '#E9ECEF',
    },
    yAxis: {
      title: { text: 'Sales (RWF)', style: { color: '#6C757D' } },
      labels: { style: { color: '#6C757D' } },
      gridLineColor: '#E9ECEF',
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(0, 191, 255, 0.4)'],
            [1, 'rgba(0, 123, 255, 0)'],
          ],
        },
        marker: { radius: 5, symbol: 'circle' },
        lineWidth: 2,
        lineColor: '#09bcedff',
        states: { hover: { lineWidth: 3 } },
        threshold: null,
      },
    },
    series: [
      {
        name: 'Sales',
        data: salesData,
        showInLegend: false,
      },
    ],
  });

  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
};

export default MonthlySalesChart; 