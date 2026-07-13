import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AppContextProvider, AppContextType, useAppContext } from '@/src/context/AppContext';
import { DockPosition } from '@/src/components/Common/Sidebar/models';
import { FeatureFlags } from '@/src/models/feature-flags';

vi.unmock('@/src/context/AppContext');

const FEATURE_FLAGS = {} as FeatureFlags;

const renderWithCapture = () => {
  let captured: AppContextType | null = null;

  const Capture = () => {
    captured = useAppContext();
    return null;
  };

  render(
    <AppContextProvider featureFlags={FEATURE_FLAGS}>
      <Capture />
    </AppContextProvider>,
  );

  return () => captured as AppContextType;
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AppContext sidebar docking', () => {
  test('defaults to a non-dockable right position', () => {
    const get = renderWithCapture();

    expect(get().sidebar.dockable).toBe(false);
    expect(get().sidebar.dockPosition).toBe(DockPosition.Right);
  });

  test('showSidebar with options enables docking; toggleDock flips and persists', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, 'w-1/2', { dockable: true, persistKey: 'key-a' });
    });

    expect(get().sidebar.dockable).toBe(true);
    expect(get().sidebar.dockPosition).toBe(DockPosition.Right);

    act(() => {
      get().sidebar.toggleDock();
    });

    expect(get().sidebar.dockPosition).toBe(DockPosition.Bottom);
    expect(localStorage.getItem('key-a')).toBe(DockPosition.Bottom);
  });

  test('restores the persisted position on the next open', () => {
    localStorage.setItem('key-a', DockPosition.Bottom);
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, { dockable: true, persistKey: 'key-a' });
    });

    expect(get().sidebar.dockPosition).toBe(DockPosition.Bottom);
  });

  test('does not persist when no persistKey is supplied', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, { dockable: true });
    });
    act(() => {
      get().sidebar.toggleDock();
    });

    expect(get().sidebar.dockPosition).toBe(DockPosition.Bottom);
    expect(localStorage.length).toBe(0);
  });

  test('toggleDockCollapsed flips collapse; toggleDock and close reset it', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, { dockable: true, persistKey: 'key-a' });
    });
    act(() => {
      get().sidebar.toggleDock();
    });
    expect(get().sidebar.dockCollapsed).toBe(false);

    act(() => {
      get().sidebar.toggleDockCollapsed();
    });
    expect(get().sidebar.dockCollapsed).toBe(true);

    // Switching dock position clears the collapsed state.
    act(() => {
      get().sidebar.toggleDock();
    });
    expect(get().sidebar.dockCollapsed).toBe(false);
  });

  test('closeSidebar resets dockable and position', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, { dockable: true, persistKey: 'key-a' });
      get().sidebar.toggleDock();
    });
    act(() => {
      get().sidebar.closeSidebar();
    });

    expect(get().sidebar.dockable).toBe(false);
    expect(get().sidebar.dockPosition).toBe(DockPosition.Right);
  });

  test('persists per key so callers do not interfere', () => {
    localStorage.setItem('key-b', DockPosition.Bottom);
    const get = renderWithCapture();

    // Caller A toggles to bottom under key-a; key-b is untouched.
    act(() => {
      get().sidebar.showSidebar(<div>a</div>, undefined, { dockable: true, persistKey: 'key-a' });
    });
    act(() => {
      get().sidebar.toggleDock();
    });

    expect(localStorage.getItem('key-a')).toBe(DockPosition.Bottom);
    expect(localStorage.getItem('key-b')).toBe(DockPosition.Bottom);

    // Caller B opens under key-b and toggles back to right; key-a is untouched.
    act(() => {
      get().sidebar.showSidebar(<div>b</div>, undefined, { dockable: true, persistKey: 'key-b' });
    });
    act(() => {
      get().sidebar.toggleDock();
    });

    expect(localStorage.getItem('key-b')).toBe(DockPosition.Right);
    expect(localStorage.getItem('key-a')).toBe(DockPosition.Bottom);
  });
});
