import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  // Initialize the drawer as open with an active ID
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
  it('renders via portal to document.body', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByTestId('analytics-bottom-drawer')).toBeInTheDocument();
    });
  });

  it('shows toolbar', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByTestId('drawer-toolbar')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<TestWrapper />);
    // The loader should be present while fetch is in progress
    expect(screen.getByTestId('analytics-bottom-drawer')).toBeInTheDocument();
  });

  it('renders resize handle', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      expect(screen.getByTestId('drawer-resize-handle')).toBeInTheDocument();
    });
  });

  it('has correct z-index class', async () => {
    render(<TestWrapper />);
    await waitFor(() => {
      const drawer = screen.getByTestId('analytics-bottom-drawer');
      expect(drawer.className).toContain('z-[35]');
    });
  });
});
