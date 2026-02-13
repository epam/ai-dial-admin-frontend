import { cloneElement, FC, ReactElement, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title?: string;
  collapsed?: boolean;
  actionButtons?: ReactNode;
  children?: ReactNode;
  header?: ReactElement<{ isCollapsed: boolean }>;
  containerClassName?: string;
  contentClassName?: string;
  errorIndicator?: boolean;
}

const Accordion: FC<Props> = ({
  children,
  title,
  header,
  collapsed = true,
  actionButtons,
  contentClassName,
  containerClassName,
  errorIndicator,
}) => {
  const t = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const icon = isCollapsed ? (
    <IconChevronRight className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
  ) : (
    <IconChevronDown className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
  );

  return (
    <div className={classNames('flex flex-col rounded border border-primary gap-4 p-4', containerClassName)}>
      {title && (
        <div className="flex flex-row justify-between">
          <button className="flex items-center w-full" onClick={toggleCollapse}>
            {icon}
            <h3 className="mx-2">{title}</h3>
            {errorIndicator && (
              <span
                role="status"
                className="flex w-2 h-2 rounded no-user-select bg-red-400"
                aria-label={t(ErrorI18nKey.Error)}
              />
            )}
          </button>
          {actionButtons}
        </div>
      )}
      {header && (
        <div className="flex items-center cursor-pointer group/accordion" onClick={toggleCollapse} role="button">
          {icon}
          {cloneElement(header, { isCollapsed })}
        </div>
      )}
      <div className={classNames('flex flex-col px-6 pb-4 overflow-auto', isCollapsed && 'hidden', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;
