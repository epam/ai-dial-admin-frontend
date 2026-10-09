'use client';

import { FC, ReactNode } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  tooltip: string;
  icon: ReactNode;
  onClick: () => void;
}

const MenuAction: FC<Props> = ({ tooltip, icon, onClick }) => {
  return (
    <DialTooltip tooltip={tooltip}>
      <button
        type="button"
        aria-label={tooltip}
        className="p-1 rounded-full cursor-pointer text-secondary hover:text-accent hover:bg-control-neutral-hover-muted focus-visible:text-accent focus-visible:bg-control-neutral-hover-muted"
        onClick={onClick}
      >
        {icon}
      </button>
    </DialTooltip>
  );
};

export default MenuAction;
