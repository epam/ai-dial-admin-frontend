'use client';

import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { CENTRAL_WINDOW_MIN_WIDTH, LOCAL_STORAGE_CENTRAL_WINDOW_KEY } from '@/src/constants/main-layout';
import { SideBarOrientation } from '@/src/types/side-bar';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { isMediumScreen, isSmallScreen } from '@/src/utils/mobile';
import { Resizable, ResizableProps, ResizeCallback } from 're-resizable';
import { LeftSideBarResizeIcon, RightSideBarResizeIcon } from './ResizeIcons';
import { MOBILE_SIDEBAR_MIN_WIDTH, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_HEIGHT, SIDEBAR_MIN_WIDTH } from './side-bar.utils';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';

interface Props {
  isOpen: boolean;
  side: SideBarOrientation;
  itemComponent: ReactNode;
}

const Sidebar: FC<Props> = ({ isOpen, side, itemComponent }) => {
  const sidebarMinWidth = isSmallScreen() ? MOBILE_SIDEBAR_MIN_WIDTH : SIDEBAR_MIN_WIDTH;
  const savedWidth = getFromLocalStorage(LOCAL_STORAGE_CENTRAL_WINDOW_KEY);

  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(savedWidth ? Number(savedWidth) : SIDEBAR_DEFAULT_WIDTH);

  const isLeftSidebar = side === SideBarOrientation.Left;
  const isRightSidebar = side === SideBarOrientation.Right;

  const sideBarElementRef = useRef<Resizable>(null);

  const [windowWidth, setWindowWidth] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
  });

  const resizeTriggerClassName = classNames(
    'invisible h-full w-0.5 group-hover:visible md:visible xl:bg-accent-primary xl:text-accent-primary',
    isResizing ? 'bg-accent-primary text-accent-primary xl:visible' : 'bg-layer-3 text-primary xl:invisible',
  );

  const centralWindowMinWidth =
    windowWidth && isMediumScreen()
      ? windowWidth / 12 // windowWidth / 12 = 8% of the windowWidth
      : CENTRAL_WINDOW_MIN_WIDTH; // fallback min width

  const maxWidth = useMemo(() => {
    if (!windowWidth) {
      return;
    }
    return Math.round(windowWidth - centralWindowMinWidth);
  }, [windowWidth, centralWindowMinWidth]);

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const onResize: ResizeCallback = useCallback(() => {
    if (!windowWidth) {
      return;
    }

    const sidebarCurrentWidth = sideBarElementRef.current?.resizable?.getClientRects()[0].width;

    const resizableWidth = sidebarCurrentWidth && Math.round(sidebarCurrentWidth);

    const width = resizableWidth ?? sidebarMinWidth;
    setSidebarWidth(width);
    setToLocalStorage(LOCAL_STORAGE_CENTRAL_WINDOW_KEY, width.toString());
  }, [windowWidth, sidebarMinWidth]);

  const onResizeStop = useCallback(() => {
    setIsResizing(false);
    const resizableWidth =
      sideBarElementRef.current?.resizable?.getClientRects()[0].width &&
      Math.round(sideBarElementRef.current?.resizable?.getClientRects()[0].width);

    const width = resizableWidth ?? sidebarMinWidth;

    setSidebarWidth(width);
    setToLocalStorage(LOCAL_STORAGE_CENTRAL_WINDOW_KEY, width.toString());
  }, [sidebarMinWidth]);

  const resizeSettings: ResizableProps = useMemo(() => {
    return {
      defaultSize: {
        width: sidebarWidth ?? sidebarMinWidth,
        height: SIDEBAR_HEIGHT,
      },
      minWidth: sidebarMinWidth,
      maxWidth,
      size: {
        width: sidebarWidth ?? sidebarMinWidth,
        height: SIDEBAR_HEIGHT,
      },
      enable: {
        top: false,
        right: isLeftSidebar,
        bottom: false,
        left: isRightSidebar,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      },
      handleClasses: {
        right: 'group invisible md:visible',
        left: 'group invisible md:visible',
      },
      handleStyles: { right: { right: '-11px' }, left: { left: '-3px' } },
      handleComponent: {
        left: <LeftSideBarResizeIcon className={resizeTriggerClassName} />,
        right: <RightSideBarResizeIcon className={resizeTriggerClassName} />,
      },
      onResizeStart: onResizeStart,
      onResizeStop: onResizeStop,
      onResize: onResize,
    };
  }, [
    isLeftSidebar,
    isRightSidebar,
    resizeTriggerClassName,
    onResizeStart,
    onResizeStop,
    onResize,
    maxWidth,
    sidebarMinWidth,
    sidebarWidth,
  ]);
  const isTablet = useIsTabletScreen();
  const isMobile = useIsMobileScreen();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuClassNames = `flex max-w-[95%] border-tertiary md:max-w-[45%], ${isMobile ? 'absolute z-[51]' : ''}`;

  return isOpen ? (
    <Resizable ref={sideBarElementRef} {...resizeSettings} className={menuClassNames}>
      <SidebarContent itemComponent={itemComponent} resizable={true} />
    </Resizable>
  ) : (
    !isTablet && <SidebarContent itemComponent={itemComponent} />
  );
};

export default Sidebar;

interface SidebarContentProps {
  itemComponent: ReactNode;
  resizable?: boolean;
}

const SidebarContent: FC<SidebarContentProps> = ({ itemComponent, resizable }) => {
  const contentClass = classNames(
    'flex flex-none shrink-0 flex-col divide-y divide-tertiary bg-layer-3 transition-all z-10',
    resizable ? 'size-full shrink-0' : 'max-w-16',
  );

  return (
    <div className={contentClass}>{<div className={classNames('h-full min-w-[42px] grow')}>{itemComponent}</div>}</div>
  );
};
