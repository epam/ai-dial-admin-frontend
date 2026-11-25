import { act, renderHook } from '@testing-library/react';
import { MouseEvent } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { TRY_OUT_SIDEBAR_CLASS_NAME } from '@/src/components/TryOut/constants';
import { useCloseTryOutSidebar, useOpenTryOutSidebar } from '@/src/components/TryOut/hooks/use-try-out-sidebar';
import { appContextMock } from '@/test-mocks/app-context';

const createClickEvent = () => ({ stopPropagation: vi.fn() }) as unknown as MouseEvent<HTMLButtonElement>;

describe('useCloseTryOutSidebar', () => {
  test('closes the sidebar and leaves the menu alone when it was not collapsed', () => {
    const toggleIsMenuClosed = vi.fn();
    appContextMock.use(() => ({ sidebar: { ...appContextMock.sidebar, isMenuClosed: false, toggleIsMenuClosed } }));
    const { result } = renderHook(() => useCloseTryOutSidebar());

    act(() => result.current());

    expect(appContextMock.sidebar.closeSidebar).toHaveBeenCalledTimes(1);
    expect(appContextMock.toggleSidebar).not.toHaveBeenCalled();
    expect(toggleIsMenuClosed).not.toHaveBeenCalled();
  });

  test('gives back the menu it collapsed on open', () => {
    const toggleIsMenuClosed = vi.fn();
    appContextMock.use(() => ({ sidebar: { ...appContextMock.sidebar, isMenuClosed: true, toggleIsMenuClosed } }));
    const { result } = renderHook(() => useCloseTryOutSidebar());

    act(() => result.current());

    expect(appContextMock.toggleSidebar).toHaveBeenCalledTimes(1);
    expect(toggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(appContextMock.sidebar.closeSidebar).toHaveBeenCalledTimes(1);
  });
});

describe('useOpenTryOutSidebar', () => {
  test('shows the content in the Try out sidebar and stops the click from bubbling', () => {
    appContextMock.use(() => ({ sidebarOpen: false }));
    const content = <div>content</div>;
    const event = createClickEvent();
    const { result } = renderHook(() => useOpenTryOutSidebar(content));

    act(() => result.current(event));

    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(appContextMock.sidebar.showSidebar).toHaveBeenCalledWith(content, TRY_OUT_SIDEBAR_CLASS_NAME);
    expect(appContextMock.toggleSidebar).not.toHaveBeenCalled();
  });

  test('collapses the main menu when it is open', () => {
    const toggleIsMenuClosed = vi.fn();
    appContextMock.use(() => ({
      sidebarOpen: true,
      sidebar: { ...appContextMock.sidebar, toggleIsMenuClosed },
    }));
    const event = createClickEvent();
    const { result } = renderHook(() => useOpenTryOutSidebar(<div />));

    act(() => result.current(event));

    expect(toggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(appContextMock.toggleSidebar).toHaveBeenCalledWith(event);
  });
});
