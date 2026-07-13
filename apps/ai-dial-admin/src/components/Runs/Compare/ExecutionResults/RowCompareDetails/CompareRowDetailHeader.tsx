'use client';

import { IconAdjustmentsHorizontal, IconLayoutBottombar, IconLayoutSidebarRight } from '@tabler/icons-react';
import { FC } from 'react';

import classNames from 'classnames';
import { DialCloseButton, DialGhostButton, DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  title: string;
  onClose: () => void;
  onOpenDisplay: () => void;
  isDisplayOpen: boolean;
  position: SidebarPosition;
  onSwitchDisplayMode: () => void;
}

const CompareRowDetailHeader: FC<Props> = ({
  title,
  onClose,
  onOpenDisplay,
  isDisplayOpen,
  position,
  onSwitchDisplayMode,
}) => {
  const t = useI18n();

  const isBottom = position === SidebarPosition.Bottom;

  return (
    <div className="flex items-center justify-between gap-4 shrink-0 px-6 py-4">
      <h3 className="dial-h3 text-primary truncate">{title}</h3>
      <div className="flex items-center gap-4 shrink-0">
        <DialGhostButton
          label={t(RunsI18nKey.RunCompareDisplay)}
          iconBefore={<IconAdjustmentsHorizontal {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onOpenDisplay}
          className={classNames(isDisplayOpen && 'text-accent-primary')}
        />
        <DialGhostIconButton
          size={ElementSize.Small}
          icon={isBottom ? <IconLayoutSidebarRight size={24} /> : <IconLayoutBottombar size={24} />}
          onClick={onSwitchDisplayMode}
          title={t(isBottom ? RunsI18nKey.SwitchToSidebar : RunsI18nKey.SwitchToBottom)}
        />
        <div className="h-4 w-px bg-secondary shrink-0" aria-hidden />
        <DialCloseButton className="h-10" size={24} onClose={onClose} />
      </div>
    </div>
  );
};

export default CompareRowDetailHeader;
