import { MouseEvent, ReactNode, useCallback } from 'react';

import { TRY_OUT_SIDEBAR_CLASS_NAME } from '@/src/components/TryOut/constants';
import { useAppContext } from '@/src/context/AppContext';

/** Closes the Try out sidebar and gives back the main menu it collapsed on open. */
export const useCloseTryOutSidebar = () => {
  const { sidebar, toggleSidebar } = useAppContext();

  return useCallback(() => {
    if (sidebar.isMenuClosed) {
      toggleSidebar();
      sidebar.toggleIsMenuClosed?.();
    }
    sidebar.closeSidebar();
  }, [sidebar, toggleSidebar]);
};

/** Returns a click handler that shows `content` in the Try out sidebar and collapses the main menu. */
export const useOpenTryOutSidebar = (content: ReactNode) => {
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  return useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      sidebar.showSidebar(content, TRY_OUT_SIDEBAR_CLASS_NAME);
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar(e);
      }
    },
    [content, sidebar, sidebarOpen, toggleSidebar],
  );
};
