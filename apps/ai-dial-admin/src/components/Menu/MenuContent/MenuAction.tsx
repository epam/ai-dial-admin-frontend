'use client';

import { FC, ReactNode } from 'react';

import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  tooltip: string;
  icon: ReactNode;
  onClick: () => void;
}

const MenuAction: FC<Props> = ({ tooltip, icon, onClick }) => {
  return (
    <Tooltip tooltip={tooltip}>
      <button
        type="button"
        aria-label="button"
        className="p-1 rounded cursor-pointer hover:text-accent-primary hover:bg-controls-accent-alpha"
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  );
};

export default MenuAction;
