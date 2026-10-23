import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import RowDetailHeader from '@/src/components/Runs/Details/RowDetails/RowDetailHeader';

const GRAFANA_URL = 'https://grafana.example.com/trace/123';

const renderHeader = (grafanaUrl?: string) =>
  render(
    <RowDetailHeader
      title="Row"
      onClose={vi.fn()}
      onOpenDisplay={vi.fn()}
      isDisplayOpen={false}
      position={SidebarPosition.Bottom}
      onSwitchDisplayMode={vi.fn()}
      grafanaUrl={grafanaUrl}
    />,
  );

describe('RowDetailHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Should open Grafana trace in a new tab when URL provided', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderHeader(GRAFANA_URL);

    fireEvent.click(screen.getByText('Runs.GrafanaDetails'));

    expect(openSpy).toHaveBeenCalledWith(GRAFANA_URL, '_blank');
  });

  test('Should not render Grafana link when no URL', () => {
    renderHeader();

    expect(screen.queryByText('Runs.GrafanaDetails')).not.toBeInTheDocument();
  });
});
