import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

const options = Highcharts.merge(commonOptions, {
  chart: { type: 'bar' },
  xAxis: {
    categories: ['Avocado', 'Ensore Milk', 'Bell Pepper', 'Onions', 'Banana'],
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
      data: [393, 312, 287, 254, 211],
      color: '#20A8CE',
      showInLegend: false,
    },
  ],
});

export default function TopSellingProductsChart() {
  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
} 