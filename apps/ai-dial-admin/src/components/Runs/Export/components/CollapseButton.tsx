'use client';

import { FC } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapseButton: FC<CollapseButtonProps> = ({ isCollapsed, onToggle }) => (
  <button className="flex-shrink-0 flex items-center" onClick={onToggle}>
    {isCollapsed ? (
      <IconChevronRight className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
    ) : (
      <IconChevronDown className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
    )}
  </button>
);

export default CollapseButton;
