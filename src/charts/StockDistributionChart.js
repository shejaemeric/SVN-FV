import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

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
      data: [
        { name: 'In Stock', y: 75, color: '#28A745' },
        { name: 'Low Stock', y: 15, color: '#FFC107' },
        { name: 'Out of Stock', y: 10, color: '#DC3545' },
      ],
    },
  ],
});

export default function StockDistributionChart() {
  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
} 