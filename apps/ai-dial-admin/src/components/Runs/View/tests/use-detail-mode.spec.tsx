import { act, renderHook } from '@testing-library/react';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { ROW_DETAIL_BOTTOM_CLASS, ROW_DETAIL_SIDEBAR_CLASS } from '@/src/components/Runs/Details/RowDetails/constants';
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

const getShownPanelProps = (callIndex = 0) =>
  (mockShowSidebar.mock.calls[callIndex][0] as { props: Record<string, unknown> }).props;

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
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), ROW_DETAIL_BOTTOM_CLASS, SidebarPosition.Bottom);
    expect(getShownPanelProps().position).toBe(SidebarPosition.Bottom);
  });

  it('hands the panel the opened row’s overall score, in the bottom drawer and after switching to the side panel', () => {
    const scores = new Map<string, number | null>([
      ['r1', 0.7],
      ['r2', null],
    ]);
    const { result } = renderHook(() => useDetailMode([], undefined, scores));

    act(() => result.current.openDetail('r1'));
    expect(getShownPanelProps().testCaseScore).toBe(0.7);

    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());
    expect(getShownPanelProps().testCaseScore).toBe(0.7);

    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r2'));
    expect(getShownPanelProps().testCaseScore).toBeNull();
  });

  it('hands the panel the run’s score threshold in both positions', () => {
    const { result } = renderHook(() => useDetailMode([], undefined, undefined, 0.6));

    act(() => result.current.openDetail('r1'));
    expect(getShownPanelProps().scoreThreshold).toBe(0.6);

    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());
    expect(getShownPanelProps().scoreThreshold).toBe(0.6);
  });

  it('opens a row without a known score with no score for the panel', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));

    expect(getShownPanelProps().testCaseScore).toBeUndefined();
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

  it('switches to the right side panel at the shared row-detail width', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());

    expect(result.current.detailMode).toBe(DetailMode.Sidebar);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), ROW_DETAIL_SIDEBAR_CLASS, SidebarPosition.Right);
    expect(getShownPanelProps().position).toBe(SidebarPosition.Right);
    expect(getShownPanelProps().resultId).toBe('r1');
  });

  it('wires the panel switch button to the opposite mode in each position', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => (getShownPanelProps().onSwitchDisplayMode as () => void)());
    expect(result.current.detailMode).toBe(DetailMode.Sidebar);

    act(() => (getShownPanelProps(mockShowSidebar.mock.calls.length - 1).onSwitchDisplayMode as () => void)());
    expect(result.current.detailMode).toBe(DetailMode.Drawer);
  });

  it('opens the side panel on a cell click with the field to scroll to', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToSidebar());
    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r1', { focusFieldKey: 'answer' }));

    expect(getShownPanelProps().position).toBe(SidebarPosition.Right);
    expect(getShownPanelProps().focusFieldKey).toBe('answer');
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

  it('keeps the Display tree chosen in the bottom panel when switching to the side panel and back', () => {
    const { result } = renderHook(() => useDetailMode());
    const persistedTree = [{ headerName: 'Execution', hide: false, children: [] }];

    act(() => result.current.openDetail('r1'));
    act(() => {
      (getShownPanelProps().onDisplayTreeChange as (tree: unknown) => void)(persistedTree);
    });

    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());
    expect(getShownPanelProps().initialDisplayTree).toBe(persistedTree);

    mockShowSidebar.mockClear();
    act(() => result.current.switchToDrawer());
    expect(getShownPanelProps().initialDisplayTree).toBe(persistedTree);
  });

  it('keeps the Display tree chosen in the side panel when switching to the bottom panel', () => {
    const { result } = renderHook(() => useDetailMode());
    const persistedTree = [{ headerName: 'Test Case Data', hide: true, children: [] }];

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToSidebar());
    act(() => {
      (getShownPanelProps(mockShowSidebar.mock.calls.length - 1).onDisplayTreeChange as (tree: unknown) => void)(
        persistedTree,
      );
    });

    mockShowSidebar.mockClear();
    act(() => result.current.switchToDrawer());

    expect(getShownPanelProps().initialDisplayTree).toBe(persistedTree);
  });
});
