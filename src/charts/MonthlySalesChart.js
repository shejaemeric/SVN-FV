import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import commonOptions from './commonOptions';

const options = Highcharts.merge(commonOptions, {
  chart: { type: 'area' },
  xAxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    labels: { style: { color: '#6C757D' } },
    lineColor: '#E9ECEF',
    tickColor: '#E9ECEF',
  },
  yAxis: {
    title: { text: 'Sales ($)', style: { color: '#6C757D' } },
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
      data: [29900, 71500, 106400, 129200, 144000, 176000, 135600, 148500, 216400, 194100, 95600, 54400],
      showInLegend: false,
    },
  ],
});

export default function MonthlySalesChart() {
  return <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'h-80' }} />;
} 