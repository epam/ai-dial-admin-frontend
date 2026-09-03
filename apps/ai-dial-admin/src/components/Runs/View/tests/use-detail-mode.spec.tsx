import { act, renderHook } from '@testing-library/react';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
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

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailBottomPanel', () => ({
  default: () => null,
}));

vi.mock('@/src/components/Runs/Details/RunMetricDetailPanel', () => ({
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

  it('toggles closed on same row click without cell options', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.openDetail('r1'));

    expect(result.current.selectedResultId).toBeNull();
    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  it('does not toggle closed on same-row cell click with focus field', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    mockShowSidebar.mockClear();
    act(() => result.current.openDetail('r1', { focusFieldKey: 'httpStatusCode' }));

    expect(result.current.selectedResultId).toBe('r1');
    expect(result.current.focusFieldKey).toBe('httpStatusCode');
    expect(mockCloseSidebar).not.toHaveBeenCalled();
    expect(mockShowSidebar).toHaveBeenCalled();
  });

  it('switches to sidebar and shows RunMetricDetailPanel', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    mockShowSidebar.mockClear();
    act(() => result.current.switchToSidebar());

    expect(result.current.detailMode).toBe(DetailMode.Sidebar);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), 'w-[750px]', SidebarPosition.Right);
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
});
