import { act, render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import { TelemetryQuery } from '@/src/models/telemetry';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div role="grid" aria-rowcount={rowData?.length ?? 0} />,
}));

const query = {
  $type: 'test',
  query: { expressions: [], from: '' },
} as unknown as TelemetryQuery;

const columnDefs = [{ field: 'name' }];

describe('TelemetryGrid', () => {
  test('fetches data on mount in uncontrolled mode', async () => {
    const getData = vi.fn(async () => ({ success: true, response: { headers: [], data: [] } }) as any);

    render(<TelemetryGrid title="Calls by Deployment" columnDefs={columnDefs} getData={getData} query={query} />);

    await vi.waitFor(() => expect(getData).toHaveBeenCalledWith(query));
  });

  // Regression for #3577: changing the Time Period rebuilds getData (it closes over the
  // time range), so the grid must refetch when a new getData reference arrives.
  test('refetches when getData reference changes (time period change)', async () => {
    const firstGetData = vi.fn(async () => ({ success: true, response: { headers: [], data: [] } }) as any);
    const secondGetData = vi.fn(async () => ({ success: true, response: { headers: [], data: [] } }) as any);

    const { rerender } = render(
      <TelemetryGrid title="Calls by Deployment" columnDefs={columnDefs} getData={firstGetData} query={query} />,
    );
    await vi.waitFor(() => expect(firstGetData).toHaveBeenCalledTimes(1));

    rerender(
      <TelemetryGrid title="Calls by Deployment" columnDefs={columnDefs} getData={secondGetData} query={query} />,
    );

    await vi.waitFor(() => expect(secondGetData).toHaveBeenCalledWith(query));
  });

  test('does not fetch in controlled mode (parent owns the data)', async () => {
    const getData = vi.fn(async () => ({ success: true, response: { headers: [], data: [] } }) as any);

    render(
      <TelemetryGrid title="Project Consumption" columnDefs={columnDefs} getData={getData} query={query} data={[]} />,
    );

    await act(async () => {});
    expect(getData).not.toHaveBeenCalled();
  });
});
