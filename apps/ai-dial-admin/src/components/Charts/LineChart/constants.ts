import { EChartsOption } from 'echarts-for-react/src/types';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

// TODO: color variables from tailwind config
export const lineChartDefaultOptions = (t: (key: string) => string): EChartsOption => {
  return {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#000000',
      borderColor: '#000000',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#F3F4F6',
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#3B82F6',
          width: 1,
        },
      },
      formatter: (params: { axisValue: string; value: string; color: string }[]) => {
        const { axisValue, value, color } = params[0];

        return `
      <div>
        <!-- Title -->
        <div style="
          font-size: 12px;
          color: #9AA2AD;
          margin-bottom: 12px;
        ">
          ${formatDateTimeToLocalString(axisValue)}
        </div>

        <!-- Content -->
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          color: #F3F4F6;
          font-size: 10px;
        ">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${color};
          "></span>

          <span>
            ${t(TelemetryI18nKey.Requests)}:
            <b>${value}</b>
          </span>
        </div>
      </div>
    `;
      },
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
      axisLabel: {
        color: '#7F8792',
        formatter: (value: string | number) => formatDateTimeToLocalString(value),
      },
    },
    yAxis: {
      type: 'value',
      nameTextStyle: {
        color: '#7F8792',
        fontSize: 12,
        fontWeight: 500,
      },
      name: t(TelemetryI18nKey.Requests),
      axisLabel: {
        color: '#7F8792',
      },
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
    color: '#74A4FF',
  };
};
