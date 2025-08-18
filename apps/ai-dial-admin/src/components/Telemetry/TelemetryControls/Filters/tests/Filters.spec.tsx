import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import Filters from '../Filters';
import { ApplicationRoute } from '@/src/types/routes';
import { FilterData } from '@/src/models/telemetry';
import { TelemetryI18nKey } from '@/src/constants/i18n';

describe('Filters', () => {
  const mockGetData = vi.fn();
  const mockSetFilters = vi.fn();

  beforeEach(() => {
    mockGetData.mockReset();
    mockSetFilters.mockReset();
  });

  test('renders filters and AddFilter button', async () => {
    render(
      <Filters
        filters={[{ value: 'f1' }] as FilterData[]}
        setFilters={mockSetFilters}
        getData={mockGetData}
        route={ApplicationRoute.Dashboard}
      />,
    );

    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.AddFilter)).toBeInTheDocument();
  });

  // test('calls addFilter when Edit is clicked', async () => {
  //   mockGetData
  //     .mockResolvedValueOnce({ success: true, response: { data: [['p1']] } })
  //     .mockResolvedValueOnce({ success: true, response: { data: [['e1']] } });

  //   const setFilters = vi.fn((fn) => {
  //     expect(typeof fn).toBe('function');
  //     // Simulate state update for edit
  //     expect(fn([{ id: 'f1' }])).toEqual([{ id: 'f1', edited: true }]);
  //   });

  //   render(
  //     <Filters
  //       filters={[{ id: 'f1' }]}
  //       setFilters={setFilters}
  //       getData={mockGetData}
  //       route={ApplicationRoute.Dashboard}
  //     />,
  //   );

  //   await waitFor(() => {
  //     fireEvent.click(screen.getByText('Edit'));
  //   });
  // });

  // test('calls addFilter when AddFilter is clicked', async () => {
  //   mockGetData
  //     .mockResolvedValueOnce({ success: true, response: { data: [['p1']] } })
  //     .mockResolvedValueOnce({ success: true, response: { data: [['e1']] } });

  //   const setFilters = vi.fn((fn) => {
  //     expect(typeof fn).toBe('function');
  //     // Simulate state update for add
  //     expect(fn([])).toEqual([{ id: 'new' }]);
  //   });

  //   render(<Filters filters={[]} setFilters={setFilters} getData={mockGetData} route={ApplicationRoute.Dashboard} />);

  //   await waitFor(() => {
  //     fireEvent.click(screen.getByText('AddFilter'));
  //   });
  // });

  // test('renders nothing if filters is empty', async () => {
  //   mockGetData
  //     .mockResolvedValueOnce({ success: true, response: { data: [['p1']] } })
  //     .mockResolvedValueOnce({ success: true, response: { data: [['e1']] } });

  //   render(
  //     <Filters filters={[]} setFilters={mockSetFilters} getData={mockGetData} route={ApplicationRoute.Dashboard} />,
  //   );

  //   await waitFor(() => {
  //     expect(screen.queryByText('Filter-0')).toBeNull();
  //   });
  // });
});
