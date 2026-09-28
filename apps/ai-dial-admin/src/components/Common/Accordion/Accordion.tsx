import { cloneElement, FC, ReactElement, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title?: string;
  /** Sits under the title while the section is open; it describes the body, so it folds away with it. */
  description?: string;
  collapsed?: boolean;
  collapsible?: boolean;
  actionButtons?: ReactNode;
  children?: ReactNode;
  header?: ReactElement<{ isCollapsed: boolean }>;
  containerClassName?: string;
  containerPaddingClassName?: string;
  contentPaddingClassName?: string;
  contentClassName?: string;
  errorIndicator?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// TODO: review after design implementation
const Accordion: FC<Props> = ({
  children,
  title,
  description,
  header,
  collapsed = true,
  collapsible = true,
  actionButtons,
  contentClassName,
  containerClassName,
  errorIndicator,
  containerPaddingClassName = 'p-4',
  contentPaddingClassName = 'px-6 pb-4',
  onCollapsedChange,
}) => {
  const t = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = useCallback(() => {
    if (!collapsible) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      onCollapsedChange?.(next);
      return next;
    });
  }, [collapsible, onCollapsedChange]);

  const icon = collapsible ? (
    isCollapsed ? (
      <IconChevronRight className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
    ) : (
      <IconChevronDown className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
    )
  ) : null;

  return (
    <div
      className={classNames(
        'flex flex-col rounded border border-primary gap-4',
        containerClassName,
        containerPaddingClassName,
      )}
    >
      {title && (
        // The description sits beside the toggle rather than inside it: within the button it joins the
        // accessible name, so the control announces itself as the title plus a sentence about the body.
        <div className="flex flex-col gap-1">
          <div className="flex flex-row justify-between">
            <button className="flex items-center w-full" onClick={toggleCollapse}>
              {icon}
              <h3 className="mx-2">{title}</h3>
              {errorIndicator && (
                <span
                  role="status"
                  className="flex size-2 rounded no-user-select bg-red-400"
                  aria-label={t(ErrorI18nKey.Error)}
                />
              )}
            </button>
            {actionButtons}
          </div>
          {description && !isCollapsed && (
            <span className={classNames('text-secondary dial-tiny-text', collapsible ? 'ml-7' : 'ml-2')}>
              {description}
            </span>
          )}
        </div>
      )}
      {header && (
        <div className="flex items-center cursor-pointer group/accordion" onClick={toggleCollapse} role="button">
          {icon}
          {cloneElement(header, { isCollapsed })}
        </div>
      )}
      <div
        className={classNames(
          'flex flex-col overflow-auto',
          isCollapsed && 'hidden',
          contentClassName,
          contentPaddingClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Accordion;
