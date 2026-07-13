import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AppContextProvider, AppContextType, useAppContext } from '@/src/context/AppContext';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
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
  vi.clearAllMocks();
});

describe('AppContext sidebar position & collapse', () => {
  test('defaults to the right position, expanded', () => {
    const get = renderWithCapture();

    expect(get().sidebar.position).toBe(SidebarPosition.Right);
    expect(get().sidebar.collapsed).toBe(false);
  });

  test('showSidebar opens at the requested position', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, SidebarPosition.Bottom);
    });

    expect(get().sidebar.position).toBe(SidebarPosition.Bottom);
    expect(get().sidebar.collapsed).toBe(false);
  });

  test('setPosition switches position at runtime and resets collapse', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, SidebarPosition.Bottom);
    });
    act(() => {
      get().sidebar.toggleCollapsed();
    });
    expect(get().sidebar.collapsed).toBe(true);

    act(() => {
      get().sidebar.setPosition(SidebarPosition.Right);
    });
    expect(get().sidebar.position).toBe(SidebarPosition.Right);
    expect(get().sidebar.collapsed).toBe(false);
  });

  test('toggleCollapsed flips the collapsed state', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, SidebarPosition.Bottom);
    });

    act(() => {
      get().sidebar.toggleCollapsed();
    });
    expect(get().sidebar.collapsed).toBe(true);

    act(() => {
      get().sidebar.toggleCollapsed();
    });
    expect(get().sidebar.collapsed).toBe(false);
  });

  test('closeSidebar resets position and collapse', () => {
    const get = renderWithCapture();

    act(() => {
      get().sidebar.showSidebar(<div>result</div>, undefined, SidebarPosition.Bottom);
    });
    act(() => {
      get().sidebar.toggleCollapsed();
    });
    act(() => {
      get().sidebar.closeSidebar();
    });

    expect(get().sidebar.position).toBe(SidebarPosition.Right);
    expect(get().sidebar.collapsed).toBe(false);
  });
});
