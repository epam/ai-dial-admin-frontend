'use client';

import { FC } from 'react';

import {
  IconArrowsExchange,
  IconChevronDown,
  IconChevronUp,
  IconLayoutSidebarRight,
  IconPin,
  IconPinFilled,
  IconTable,
  IconX,
} from '@tabler/icons-react';
import classNames from 'classnames';
import { DialCloseButton, DialEllipsisTooltip, DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { ViewMode } from './models';

interface Props {
  viewMode: ViewMode;
  onSetView: (mode: ViewMode) => void;
  activeId: string | null;
  activeName: string | null;
  pinnedId: string | null;
  pinnedName: string | null;
  onPin: () => void;
  onUnpin: () => void;
  diffCount: number;
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onClose: () => void;
  onSwitchToSidebar: () => void;
}

const DrawerToolbar: FC<Props> = ({
  viewMode,
  onSetView,
  activeId,
  activeName,
  pinnedId,
  pinnedName,
  onPin,
  onUnpin,
  diffCount,
  isCollapsed,
  onCollapse,
  onExpand,
  onClose,
  onSwitchToSidebar,
}) => {
  const t = useI18n();

  return (
    <div
      className="flex items-center gap-2 px-3 h-[34px] border-b border-secondary dial-tiny-text shrink-0"
      role="toolbar"
      aria-label={t(RunsI18nKey.AnalysisToolbarLabel)}
    >
      <span className="font-semibold text-primary">{t(RunsI18nKey.Analysis)}</span>

      {!pinnedId && activeId && (
        <button
          onClick={onPin}
          className="flex items-center gap-1 bg-layer-2 rounded px-1.5 py-0.5 text-secondary hover:text-primary hover:bg-layer-3"
          title={t(RunsI18nKey.Pin)}
        >
          <IconPin size={12} />
          <DialEllipsisTooltip text={activeName ?? activeId ?? ''} className="dial-caption-text max-w-[120px]" />
        </button>
      )}

      {pinnedId && (
        <div className="flex items-center gap-1 bg-layer-3 rounded px-1.5 py-0.5 text-secondary">
          <IconPinFilled size={12} />
          <DialEllipsisTooltip text={pinnedName ?? pinnedId ?? ''} className="max-w-[120px]" />
          <button onClick={onUnpin} className="ml-0.5 hover:text-primary" title={t(RunsI18nKey.Unpin)}>
            <IconX size={12} />
          </button>
        </div>
      )}

      {pinnedId && diffCount > 0 && (
        <span className="bg-warning text-warning rounded px-1.5 py-0.5 dial-caption-text">
          {t(RunsI18nKey.Diffs, { count: diffCount })}
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-0.5 bg-layer-2 rounded p-0.5">
        <button
          onClick={() => onSetView('table')}
          className={classNames(
            'flex items-center gap-1 px-1.5 py-0.5 rounded dial-caption-text',
            viewMode === 'table' ? 'bg-layer-3 text-primary' : 'text-secondary hover:text-primary',
          )}
          title={t(RunsI18nKey.Table)}
        >
          <IconTable size={14} />
          {t(RunsI18nKey.Table)}
        </button>
        <button
          onClick={() => onSetView('pivot')}
          className={classNames(
            'flex items-center gap-1 px-1.5 py-0.5 rounded dial-caption-text',
            viewMode === 'pivot' ? 'bg-layer-3 text-primary' : 'text-secondary hover:text-primary',
          )}
          title={t(RunsI18nKey.Pivot)}
        >
          <IconArrowsExchange size={14} />
          {t(RunsI18nKey.Pivot)}
        </button>
      </div>

      <DialGhostIconButton
        size={ElementSize.Small}
        icon={<IconLayoutSidebarRight size={16} />}
        onClick={onSwitchToSidebar}
        title={t(RunsI18nKey.SwitchToSidebar)}
      />

      <DialGhostIconButton
        size={ElementSize.Small}
        icon={isCollapsed ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        onClick={isCollapsed ? onExpand : onCollapse}
        title={isCollapsed ? t(RunsI18nKey.Expand) : t(RunsI18nKey.Collapse)}
      />

      <DialCloseButton onClose={onClose} ariaLabel={t(ButtonsI18nKey.Close)} />
    </div>
  );
};

export default DrawerToolbar;
