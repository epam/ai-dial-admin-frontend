import { render, screen } from '@testing-library/react';
import SingleValueChart from './SingleValueChart';
import { describe, it, expect, vi, test } from 'vitest';
import { BasicI18nKey } from '@/src/constants/i18n';

const validQuery = {
  $type: 'test',
  query: {
    expressions: [],
    from: '',
  },
};

const mockGetData = vi.fn(async () => ({ success: true, response: 42 }));
const defaultProps = {
  title: 'Test Title',
  getData: mockGetData,
  query: validQuery,
  unit: 'ms',
};

describe('SingleValueChart', () => {
  test('renders the title as text', () => {
    render(<SingleValueChart {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders the unit if provided', async () => {
    render(<SingleValueChart {...defaultProps} />);
    expect(await screen.findByText('ms')).toBeInTheDocument();
  });

  test('renders NoDataContent if data is null', async () => {
    mockGetData.mockResolvedValueOnce({ success: false } as any);
    render(<SingleValueChart {...defaultProps} />);
    expect(await screen.findByText(BasicI18nKey.NoData)).toBeInTheDocument();
  });

  test('invokes the injected getValue reducer when provided', async () => {
    const telemetryResponse = { headers: ['value'], data: [['1']] };
    const getDataWithTelemetry = vi.fn(async () => ({ success: true, response: telemetryResponse }));
    const getValue = vi.fn(() => 777);

    render(
      <SingleValueChart
        title="With Reducer"
        getData={getDataWithTelemetry}
        query={validQuery}
        getValue={getValue}
      />,
    );

    expect(await screen.findByText('777')).toBeInTheDocument();
    expect(getValue).toHaveBeenCalledWith(telemetryResponse);
  });
});
