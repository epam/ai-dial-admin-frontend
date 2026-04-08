import { act, renderHook } from '@testing-library/react';

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

describe('useDetailMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with sidebar mode', () => {
    const { result } = renderHook(() => useDetailMode());

    expect(result.current.detailMode).toBe(DetailMode.Sidebar);
    expect(result.current.selectedResultId).toBeNull();
    expect(result.current.drawerOpen).toBe(false);
  });

  it('opens sidebar on row click in sidebar mode', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));

    expect(result.current.selectedResultId).toBe('r1');
    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
  });

  it('toggles sidebar closed on same row click', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.openDetail('r1'));

    expect(result.current.selectedResultId).toBeNull();
    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  it('switches to drawer mode', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToDrawer());

    expect(result.current.detailMode).toBe(DetailMode.Drawer);
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.pendingFocus).toBe(true);
    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  it('opens drawer on row click in drawer mode', () => {
    const { result } = renderHook(() => useDetailMode());

    // Switch to drawer mode first
    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToDrawer());

    mockCloseSidebar.mockClear();

    act(() => result.current.openDetail('r2'));

    expect(result.current.selectedResultId).toBe('r2');
    expect(result.current.drawerOpen).toBe(true);
    // Should NOT call sidebar in drawer mode
    expect(mockCloseSidebar).not.toHaveBeenCalled();
  });

  it('toggles drawer closed on same row click in drawer mode', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToDrawer());
    act(() => result.current.openDetail('r1'));

    expect(result.current.selectedResultId).toBeNull();
    expect(result.current.drawerOpen).toBe(false);
  });

  it('closeDetail preserves mode preference', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.openDetail('r1'));
    act(() => result.current.switchToDrawer());
    act(() => result.current.closeDetail());

    expect(result.current.detailMode).toBe(DetailMode.Drawer);
    expect(result.current.drawerOpen).toBe(false);
  });

  it('clearPendingFocus works', () => {
    const { result } = renderHook(() => useDetailMode());

    act(() => result.current.switchToDrawer());

    expect(result.current.pendingFocus).toBe(true);

    act(() => result.current.clearPendingFocus());

    expect(result.current.pendingFocus).toBe(false);
  });

  it('calls closeSidebar on unmount', () => {
    const { unmount } = renderHook(() => useDetailMode());

    mockCloseSidebar.mockClear();
    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});
