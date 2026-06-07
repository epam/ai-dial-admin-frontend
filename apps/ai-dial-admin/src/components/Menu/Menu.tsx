'use client';

import { FC } from 'react';

import { SideBarOrientation } from '@/src/types/side-bar';
import { useAppContext } from '@/src/context/AppContext';

import MenuContent from '@/src/components/Menu/MenuContent/MenuContent';
import Sidebar from '@/src/components/SideBar/SideBar';

interface Props {
  disableMenuItems: string[];
}
const Menu: FC<Props> = ({ ...props }) => {
  const { sidebarOpen } = useAppContext();

  return (
    <Sidebar
      side={SideBarOrientation.Left}
      isSidebarOpen={sidebarOpen}
      itemComponent={<MenuContent {...props} isSidebarOpen={sidebarOpen} />}
    />
  );
};

export default Menu;
