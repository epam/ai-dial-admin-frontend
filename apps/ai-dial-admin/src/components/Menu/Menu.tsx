'use client';

import { FC, useEffect, useState } from 'react';

import { SideBarOrientation } from '@/src/types/side-bar';
import { useAppContext } from '@/src/context/AppContext';

import MenuContent from '@/src/components/Menu/MenuContent/MenuContent';
import Sidebar from '@/src/components/SideBar/SideBar';

interface Props {
  disableMenuItems: string[];
}
const Menu: FC<Props> = ({ ...props }) => {
  const { sidebarOpen } = useAppContext();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(sidebarOpen);
  }, [sidebarOpen]);

  return (
    <Sidebar
      side={SideBarOrientation.Left}
      isSidebarOpen={isSidebarOpen}
      itemComponent={<MenuContent {...props} isSidebarOpen={isSidebarOpen} />}
    />
  );
};

export default Menu;
