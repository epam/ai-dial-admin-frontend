import { act, renderHook } from '@testing-library/react';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { ROW_DETAIL_BOTTOM_CLASS, ROW_DETAIL_SIDEBAR_CLASS } from '../../Details/RowDetails/constants';
import { DetailMode } from '../../Details/BottomDrawer/models';
import { useDetailMode } from '../use-detail-mode';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      showSidebar: mockShowSidebar,
      closeSidebar: mockCloseSidebar,
    },
    featureFlags: { deploymentsEnabled: true },
    isReadOnlyAdmin: false,
  }),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailPanel', () => ({
  default: () => null,
}));

describe('useDetailMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with drawer mode by default', () => {
    const { result } = renderHook(() => useDetailMode());

    expect(result.current.detailMode).toBe(DetailMode.Drawer);
    expect(result.current.selectedResultId).toBeNull();
  });

  it('opens bottom panel on row click in drawer mode', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));

    expect(result.current.selectedResultId).toBe('r1');
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), expect.any(String), SidebarPosition.Bottom);
  });

  it('keeps the panel open on same-row cell click and updates the focus field', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r1', { focusFieldKey: 'httpStatusCode' }));

    expect(result.current.selectedResultId).toBe('r1');
    expect(result.current.focusFieldKey).toBe('httpStatusCode');
    expect(mockCloseSidebar).not.toHaveBeenCalled();
    expect(mockShowSidebar).toHaveBeenCalled();
  });

  it('switches to sidebar and shows the row-detail panel on the right', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());

    expect(result.current.detailMode).toBe(DetailMode.Sidebar);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), ROW_DETAIL_SIDEBAR_CLASS, SidebarPosition.Right);
    const panel = mockShowSidebar.mock.calls[0][0] as { props: { position: SidebarPosition; resultId: string } };
    expect(panel.props.position).toBe(SidebarPosition.Right);
    expect(panel.props.resultId).toBe('r1');
  });

  it('switches back to the bottom panel with the bottom class', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToSidebar());
    mockShowSidebar.mockClear();
    act(() => result.current.switchToDrawer());

    expect(result.current.detailMode).toBe(DetailMode.Drawer);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), ROW_DETAIL_BOTTOM_CLASS, SidebarPosition.Bottom);
  });

  it('forwards the focus field to the right panel in sidebar mode', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToSidebar());
    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r1', { focusFieldKey: 'answer' }));

    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), ROW_DETAIL_SIDEBAR_CLASS, SidebarPosition.Right);
    const panel = mockShowSidebar.mock.calls[0][0] as { props: { focusFieldKey: string | null } };
    expect(panel.props.focusFieldKey).toBe('answer');
  });

  it('passes the persisted Display tree to the right panel after a position switch', () => {
    const { result } = renderHook(() => useDetailMode());
    const persistedTree = [{ headerName: 'Execution', hide: false, children: [] }];

    act(() => result.current.openDetail('r1'));
    const bottomPanel = mockShowSidebar.mock.calls[0][0] as {
      props: { onDisplayTreeChange?: (tree: unknown) => void };
    };
    act(() => bottomPanel.props.onDisplayTreeChange?.(persistedTree));

    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());

    const rightPanel = mockShowSidebar.mock.calls[0][0] as { props: { initialDisplayTree?: unknown } };
    expect(rightPanel.props.initialDisplayTree).toBe(persistedTree);
  });

  it('closeDetail preserves mode preference', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.closeDetail());

    expect(result.current.detailMode).toBe(DetailMode.Drawer);
    expect(result.current.selectedResultId).toBeNull();
  });

  it('calls closeSidebar on unmount', () => {
    const { unmount } = renderHook(() => useDetailMode());

    mockCloseSidebar.mockClear();
    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  it('reopens the bottom panel with the persisted Display tree', () => {
    const { result } = renderHook(() => useDetailMode());
    const persistedTree = [
      {
        headerName: 'Execution',
        hide: false,
        children: [{ headerName: 'Duration', hide: false, context: { panelName: 'execDurationMs' } }],
      },
    ];

    act(() => result.current.openDetail('r1'));

    const firstPanel = mockShowSidebar.mock.calls[0][0] as { props: { onDisplayTreeChange?: (tree: unknown) => void } };
    act(() => {
      firstPanel.props.onDisplayTreeChange?.(persistedTree);
    });

    act(() => result.current.closeDetail());
    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r1'));

    const reopenedPanel = mockShowSidebar.mock.calls[0][0] as { props: { initialDisplayTree?: unknown } };
    expect(reopenedPanel.props.initialDisplayTree).toBe(persistedTree);
  });
});
