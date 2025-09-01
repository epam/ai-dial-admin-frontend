import { EChartsOption } from 'echarts-for-react/src/types';

// TODO: color variables from tailwind config
export const lineChartDefaultOptions: EChartsOption = {
  title: {
    show: false,
  },
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: [],
    splitLine: {
      show: true,
      lineStyle: {
        color: '#222932',
        width: 1,
      },
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
  },
  yAxis: {
    type: 'value',
    splitLine: {
      show: true,
      lineStyle: {
        color: '#222932',
        width: 1,
      },
    },
  },
  series: [
    {
      type: 'line',
      data: [],
      smooth: true,
      areaStyle: {
        color: '#5C8DEA2B',
      },
    },
  ],
  grid: {
    left: 30,
    right: 0,
    bottom: 20,
    top: 10,
    borderColor: '',
  },
  color: '#5C8DEA',
};
