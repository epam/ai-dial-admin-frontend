'use client';

import { FC } from 'react';
import dynamic from 'next/dynamic';

import MenuContent from './MenuContent/MenuContent';
import { SideBarOrientation } from '@/src/types/side-bar';
import { useAppContext } from '@/src/context/AppContext';

const Sidebar = dynamic(() => import('@/src/components/SideBar/SideBar'), { ssr: false });

interface Props {
  disableMenuItems: string[];
}
const Menu: FC<Props> = ({ ...props }) => {
  const { sidebarOpen } = useAppContext();

  return <Sidebar side={SideBarOrientation.Left} isOpen={sidebarOpen} itemComponent={<MenuContent {...props} />} />;
};

export default Menu;
