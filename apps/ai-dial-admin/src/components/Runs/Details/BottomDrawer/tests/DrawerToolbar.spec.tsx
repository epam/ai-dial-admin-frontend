import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DrawerToolbar from '../DrawerToolbar';

describe('DrawerToolbar', () => {
  const defaultProps = {
    viewMode: 'table' as const,
    onSetView: vi.fn(),
    pinnedId: null as string | null,
    pinnedName: null as string | null,
    onUnpin: vi.fn(),
    diffCount: 0,
    isCollapsed: false,
    onCollapse: vi.fn(),
    onExpand: vi.fn(),
    onClose: vi.fn(),
    onSwitchToSidebar: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders title', () => {
    render(<DrawerToolbar {...defaultProps} />);
    expect(screen.getByText('Runs.Analysis')).toBeInTheDocument();
  });

  it('shows pin badge when pinned', () => {
    render(<DrawerToolbar {...defaultProps} pinnedId="r1" pinnedName="Test Case 1" />);
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
  });

  it('does not show pin badge when not pinned', () => {
    render(<DrawerToolbar {...defaultProps} />);
    expect(screen.queryByTitle('Runs.Unpin')).not.toBeInTheDocument();
  });

  it('shows diff count when pinned and diffs exist', () => {
    render(<DrawerToolbar {...defaultProps} pinnedId="r1" diffCount={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('does not show diff count when no pinned', () => {
    render(<DrawerToolbar {...defaultProps} diffCount={3} />);
    expect(screen.queryByText(/3/)).not.toBeInTheDocument();
  });

  it('calls onSetView when view toggle clicked', async () => {
    render(<DrawerToolbar {...defaultProps} viewMode="table" />);
    await userEvent.click(screen.getByTitle('Runs.Pivot'));
    expect(defaultProps.onSetView).toHaveBeenCalledWith('pivot');
  });

  it('calls onSwitchToSidebar', async () => {
    render(<DrawerToolbar {...defaultProps} />);
    await userEvent.click(screen.getByTitle('Runs.SwitchToSidebar'));
    expect(defaultProps.onSwitchToSidebar).toHaveBeenCalled();
  });

  it('calls onClose', async () => {
    render(<DrawerToolbar {...defaultProps} />);
    await userEvent.click(screen.getByTitle('Runs.Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onCollapse when not collapsed', async () => {
    render(<DrawerToolbar {...defaultProps} isCollapsed={false} />);
    await userEvent.click(screen.getByTitle('Runs.Collapse'));
    expect(defaultProps.onCollapse).toHaveBeenCalled();
  });

  it('calls onExpand when collapsed', async () => {
    render(<DrawerToolbar {...defaultProps} isCollapsed={true} />);
    await userEvent.click(screen.getByTitle('Runs.Collapse'));
    expect(defaultProps.onExpand).toHaveBeenCalled();
  });
});
