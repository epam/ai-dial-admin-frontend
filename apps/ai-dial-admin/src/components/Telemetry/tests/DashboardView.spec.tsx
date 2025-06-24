import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DashboardView from '@/src/components/Telemetry/DashboardView';
import * as telemetryUtils from '@/src/utils/telemetry';

vi.spyOn(telemetryUtils, 'getLineChartData').mockReturnValue([{ time: '2025-04-06T10:57:00Z', requests: '1' }]);
vi.spyOn(telemetryUtils, 'getSingleValueChartData').mockReturnValue(1);
vi.spyOn(telemetryUtils, 'getGridData').mockReturnValue([
  {
    name: 'name',
    requests: '1',
    cost: '0',
    prompts: '1',
    completions: '1',
  },
]);

describe('Components - DashboardView', () => {
  test('should render correctly', () => {
    const { getByTestId } = render(<DashboardView />);

    const view = getByTestId('dashboard-view');
    expect(view).toBeTruthy();

    const heading = getByTestId('dashboard-view-heading');
    expect(heading).toBeTruthy();
  });

  test('should render grafanaLink', () => {
    const { getByRole } = render(<DashboardView grafanaLink={'http://localhost'} />);

    const link = getByRole('link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('http://localhost');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
