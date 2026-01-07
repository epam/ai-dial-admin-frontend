import { FC, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  title: string;
  collapsed?: boolean;
  actionButtons?: ReactNode;
  children?: ReactNode;
  containerClassName?: string;
  contentClassName?: string;
}

const Accordion: FC<Props> = ({
  children,
  title,
  collapsed = true,
  actionButtons,
  contentClassName,
  containerClassName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={classNames('flex flex-col p-4 rounded border border-primary', containerClassName)}>
      <div className="flex flex-row justify-between">
        <button className="flex items-center" onClick={toggleCollapse}>
          {isCollapsed ? (
            <IconChevronRight className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
          ) : (
            <IconChevronDown className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
          )}

          <h3 className="mx-2">{title}</h3>
        </button>
        {actionButtons}
      </div>
      <div className={classNames('flex flex-col px-6 pt-4', isCollapsed && 'hidden', contentClassName)}>{children}</div>
    </div>
  );
};

export default Accordion;
