'use client';

import { ButtonAppearance, DIAL_ICON_SIZE, ElementSize, GhostIconButton } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { BasicI18nKey, ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedCount: number;
  isCompact: boolean;
  onClearSelection: () => void;
  onDelete: () => void;
}

const BulkActionsPanel: FC<Props> = ({ selectedCount, isCompact, onClearSelection, onDelete }) => {
  const t = useI18n();
  const clearLabel = t(BasicI18nKey.ClearSelection);

  return (
    <div className={classNames('absolute z-10', isCompact ? 'inset-x-0 bottom-0' : 'bottom-4 left-4 right-4')}>
      <div className={classNames({ 'flex w-full justify-center': !isCompact })}>
        <div
          role="toolbar"
          aria-label={t(ButtonsI18nKey.BulkActions)}
          className={classNames(
            'flex h-16 items-center bg-layer-base',
            isCompact
              ? 'w-full gap-2 border-t border-tertiary px-3'
              : 'w-auto max-w-full gap-3 rounded-[12px] px-6 shadow-sm',
          )}
        >
          <div className="flex shrink-0 items-center gap-1 dial-small-semi-text text-primary">
            <span role="status" aria-live="polite" className="flex items-center gap-1">
              <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-control-neutral-active px-1 dial-small-text font-semibold text-primary">
                {selectedCount}
              </span>
              <span className={classNames('whitespace-nowrap', { 'sr-only': isCompact })}>
                {t(FileManagerI18nKey.SelectedItems)}
              </span>
            </span>
            <GhostIconButton
              size={isCompact ? ElementSize.Standard : ElementSize.Small}
              aria-label={clearLabel}
              tooltipProps={{ tooltip: clearLabel }}
              icon={<IconX size={DIAL_ICON_SIZE.SM} aria-hidden />}
              onClick={onClearSelection}
            />
          </div>
          {isCompact && <div className="h-[26px] w-px bg-control-disable-primary" aria-hidden />}
          <div className={classNames('flex items-center', isCompact ? 'min-w-0 flex-1 justify-between' : 'gap-3')}>
            <RemoveButton
              appearance={ButtonAppearance.Ghost}
              label={isCompact ? '' : t(ButtonsI18nKey.Delete)}
              aria-label={t(ButtonsI18nKey.Delete)}
              onClick={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsPanel;
