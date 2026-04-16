import { render, screen, waitFor } from '@testing-library/react';

import { useDrawerPanel } from '../useDrawerPanel';

import AnalyticsBottomDrawer from '../AnalyticsBottomDrawer';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResultDetails: vi.fn().mockResolvedValue({
    id: 'r1',
    responseStatusCode: 200,
    runIndex: 0,
    executionStatus: 'SUCCESS',
    execDurationMs: 1000,
    testCaseName: 'Test Case 1',
    testCaseData: { input: 'hello' },
    metricValues: {},
  }),
}));

function TestWrapper({ initialActiveId = 'r1' }: { initialActiveId?: string }) {
  const drawerPanel = useDrawerPanel();

  if (!drawerPanel.isOpen && initialActiveId) {
    drawerPanel.open(initialActiveId);
  }

  return (
    <AnalyticsBottomDrawer
      drawerPanel={drawerPanel}
      pendingFocus={false}
      clearPendingFocus={vi.fn()}
      onClose={vi.fn()}
      onSwitchToSidebar={vi.fn()}
    />
  );
}

describe('AnalyticsBottomDrawer', () => {
  it('renders as complementary landmark', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Runs.AnalysisDrawerLabel' })).toBeInTheDocument();
    });
  });

  it('shows toolbar', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: 'Runs.AnalysisToolbarLabel' })).toBeInTheDocument();
    });
  });

  it('renders resize handle', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByRole('separator', { name: 'Runs.ResizeDrawerLabel' })).toBeInTheDocument();
    });
  });

  it('has correct z-index class', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      const drawer = screen.getByRole('complementary', { name: 'Runs.AnalysisDrawerLabel' });
      // z-index is on the Resizable wrapper (parent), not the complementary element itself
      expect(drawer.parentElement?.className).toContain('z-[35]');
    });
  });
});
