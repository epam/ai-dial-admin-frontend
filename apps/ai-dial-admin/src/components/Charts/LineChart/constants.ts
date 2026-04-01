import { EChartsOption } from 'echarts-for-react/src/types';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

export const MULTI_SERIES_COLORS = ['#5C8DEA', '#4ECDC4', '#FFB347', '#FF6B6B', '#A78BFA', '#34D399'];

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
        color: '#EEF1F7',
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
          color: #9FA6BD;
          margin-bottom: 12px;
        ">
          ${formatDateTimeToLocalString(axisValue)}
        </div>

        <!-- Content -->
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          color: #EEF1F7;
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

export const multiSeriesLineChartOptions = (t: (key: string) => string): EChartsOption => {
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
        color: '#EEF1F7',
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#3B82F6',
          width: 1,
        },
      },
      formatter: (params: { axisValue: string; seriesName: string; value: string; color: string }[]) => {
        if (!params.length) return '';
        const title = formatDateTimeToLocalString(params[0].axisValue);
        const items = params
          .map(
            (p) => `
            <div style="display:flex;align-items:center;gap:6px;color:#EEF1F7;font-size:10px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
              <span>${p.seriesName}: <b>${p.value}</b></span>
            </div>`,
          )
          .join('');

        return `<div>
          <div style="font-size:12px;color:#9FA6BD;margin-bottom:12px;">${title}</div>
          ${items}
        </div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: '#7F8792',
        fontSize: 12,
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
      name: t(TelemetryI18nKey.RequestsNumber),
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
    series: [],
    grid: {
      left: 30,
      right: 0,
      bottom: 40,
      top: 10,
      borderColor: '',
    },
    color: MULTI_SERIES_COLORS,
  };
};
