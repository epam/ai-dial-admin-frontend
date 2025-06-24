import SingleValueChart from '@/src/components/Charts/SingleValueChart/SingleValueChart';
import { render } from '@testing-library/react';
import { MONEY_QUERY } from '@/src/constants/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { describe, expect, test } from 'vitest';

function getData(): Promise<ServerActionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, response: { data: ['2345'] } });
    }, 0);
  });
}

describe('Components - SingleValueChart', () => {
  test('renders correctly', () => {
    const { getByTestId } = render(
      <SingleValueChart title={'Title'} getData={getData} query={MONEY_QUERY} unit={'$'} />,
    );

    setTimeout(() => {
      const title = getByTestId('chart-title');
      const chartValue = getByTestId('chart-value');
      const chartValueUnit = getByTestId('chart-value-unit');

      expect(title).toBeTruthy();
      expect(title.innerHTML).toBe('Title');
      expect(chartValue).toBeTruthy();
      expect(chartValue.innerHTML).toBe('2.3 K');
      expect(chartValueUnit).toBeTruthy();
      expect(chartValueUnit.innerHTML).toBe('$');
    }, 2000);
  });
});
