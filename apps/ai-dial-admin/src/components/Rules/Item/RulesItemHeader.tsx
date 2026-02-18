'use client';

import { FC, ReactNode } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  children?: ReactNode;
  folderName?: string;
  folderDescription?: string;
  isCollapsed: boolean;
  isAlwaysToggled?: boolean;
  toggleCollapse: () => void;
}

const RulesItemHeader: FC<Props> = ({
  children,
  folderName,
  folderDescription,
  isCollapsed,
  isAlwaysToggled,
  toggleCollapse,
}) => {
  const t = useI18n();

  return (
    <div
      role="button"
      className={classNames(
        'flex items-center',
        !isCollapsed && 'mb-4',
        isAlwaysToggled && 'cursor-default justify-between',
      )}
      onClick={isAlwaysToggled ? void 0 : toggleCollapse}
    >
      {!isAlwaysToggled &&
        (isCollapsed ? (
          <IconChevronRight className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
        ) : (
          <IconChevronDown className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />
        ))}
      <div className="flex flex-col gap-1">
        <h3 className={classNames(!isAlwaysToggled && 'mx-2')}>{folderName || t(FoldersI18nKey.Permissions)}</h3>
        {folderDescription && <span className="tiny text-secondary">{folderDescription}</span>}
      </div>
      {children}
    </div>
  );
};

export default RulesItemHeader;
