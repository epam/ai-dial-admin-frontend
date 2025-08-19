'use client';

import { FC, ReactNode } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  children?: ReactNode;
  folderName?: string;
  isCollapsed: boolean;
  isAlwaysToggled?: boolean;
  toggleCollapse: () => void;
}

const RulesItemHeader: FC<Props> = ({ children, folderName, isCollapsed, isAlwaysToggled, toggleCollapse }) => {
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
      {!isAlwaysToggled && (
        <i className="text-icon-secondary">
          {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
        </i>
      )}
      <h3 className={classNames(!isAlwaysToggled && 'mx-2')}>{folderName || t(FoldersI18nKey.Permissions)}</h3>
      {children}
    </div>
  );
};

export default RulesItemHeader;
