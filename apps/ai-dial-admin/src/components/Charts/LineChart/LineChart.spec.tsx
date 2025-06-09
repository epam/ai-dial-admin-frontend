import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import LineChart from '@/src/components/Charts/LineChart/LineChart';
import * as utils from '@/src/utils/telemetry';
import { waitFor } from '@testing-library/dom';

const getData = jest.fn(() =>
  Promise.resolve({
    success: true,
    response: { data: [['12'], ['2345']], headers: ['time', 'value'] },
  }),
);

const getEmptyData = jest.fn(() =>
  Promise.resolve({
    success: true,
    response: { data: [], headers: ['time', 'value'] },
  }),
);

const getFailData = jest.fn(() =>
  Promise.resolve({
    success: false,
    response: { data: [], headers: [] },
  }),
);

describe('Components - SingleValueChart', () => {
  it('renders correctly', () => {
    const { getByTestId } = renderWithContext(<LineChart getData={getData} refreshTime={'1m'} />);
    const prepareChartData = jest.spyOn(utils, 'prepareChartData');
    const getLineChartData = jest.spyOn(utils, 'getLineChartData');
    const loader = getByTestId('chart-loader');
    expect(loader).toBeTruthy();

    waitFor(() => {
      const chart = getByTestId('chart');
      expect(prepareChartData).toHaveBeenCalledTimes(1);
      expect(getLineChartData).toHaveBeenCalledTimes(1);
      expect(chart).toBeTruthy();
    });
  });

  it('renders correctly with no data', () => {
    const { getByTestId } = renderWithContext(<LineChart getData={getEmptyData} refreshTime={'1m'} />);
    const getLineChartData = jest.spyOn(utils, 'getLineChartData');
    const loader = getByTestId('chart-loader');
    expect(loader).toBeTruthy();

    waitFor(() => {
      const chartNoData = getByTestId('chart-no-data');
      expect(getLineChartData).toHaveBeenCalledTimes(0);
      expect(chartNoData).toBeTruthy();
    });
  });

  it('renders correctly with failed data request', () => {
    const { getByTestId } = renderWithContext(<LineChart getData={getFailData} refreshTime={'1m'} />);
    const getLineChartData = jest.spyOn(utils, 'getLineChartData');
    const loader = getByTestId('chart-loader');
    expect(loader).toBeTruthy();

    waitFor(() => {
      const chartNoData = getByTestId('chart-no-data');
      expect(getLineChartData).toHaveBeenCalledTimes(0);
      expect(chartNoData).toBeTruthy();
    });
  });

  it('updates correctly by provided interval', () => {
    const { getByTestId } = renderWithContext(<LineChart getData={getData} refreshTime={'1m'} />);
    const prepareChartData = jest.spyOn(utils, 'prepareChartData');
    const getLineChartData = jest.spyOn(utils, 'getLineChartData');

    waitFor(() => {
      const chart = getByTestId('chart');
      expect(prepareChartData).toHaveBeenCalledTimes(2);
      expect(getLineChartData).toHaveBeenCalledTimes(2);
      expect(chart).toBeTruthy();
    });
  });

  it('updates correctly without provided interval', () => {
    const { getByTestId } = renderWithContext(<LineChart getData={getData} />);
    const prepareChartData = jest.spyOn(utils, 'prepareChartData');
    const getLineChartData = jest.spyOn(utils, 'getLineChartData');

    waitFor(
      () => {
        const chart = getByTestId('chart');
        expect(prepareChartData).toHaveBeenCalledTimes(1);
        expect(getLineChartData).toHaveBeenCalledTimes(1);
        expect(chart).toBeTruthy();
      },
      { timeout: 61000 },
    );
  });
});
