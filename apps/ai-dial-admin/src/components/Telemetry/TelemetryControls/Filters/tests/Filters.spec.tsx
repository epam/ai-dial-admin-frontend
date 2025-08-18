import { TelemetryI18nKey } from '@/src/constants/i18n';
import { FilterData } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Filters from '../Filters';

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
});
