import React, { FC, ReactNode, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  title: string;
  children: ReactNode;
  headerButton?: ReactNode;
}

const CollapsableSection: FC<Props> = ({ title, children, headerButton }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={classNames('flex flex-col rounded border border-primary p-4', !isCollapsed && 'flex-1')}>
      <div className="flex flex-row">
        <button className="flex flex-1 items-center justify-between" onClick={toggleCollapse}>
          <div className="flex flex-row">
            <i className="text-icon-secondary">
              {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
            </i>
            <h3 className="mx-2">{title}</h3>
          </div>
        </button>
        {!isCollapsed && headerButton}
      </div>
      <div className={classNames('flex flex-col h-full gap-6 py-4', isCollapsed && 'hidden')}>{children}</div>
    </div>
  );
};

export default CollapsableSection;
