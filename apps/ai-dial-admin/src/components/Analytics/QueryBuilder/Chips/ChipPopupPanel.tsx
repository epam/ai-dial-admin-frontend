'use client';

import { FC, ReactNode } from 'react';

import { ElementSize, GhostButton, GhostIconButton, PrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  titleId: string;
  title: string;
  isApplyDisabled: boolean;
  onApply: () => void;
  onCancel: () => void;
  onBack?: () => void;
  onRemove?: () => void;
  children: ReactNode;
}

const ChipPopupPanel: FC<Props> = ({
  titleId,
  title,
  isApplyDisabled,
  onApply,
  onCancel,
  onBack,
  onRemove,
  children,
}) => {
  const t = useI18n();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 px-5 pb-3 pt-5">
      <div className="flex shrink-0 items-center gap-2">
        {onBack && (
          <GhostIconButton
            size={ElementSize.Small}
            aria-label={t(ButtonsI18nKey.Back)}
            icon={<IconChevronLeft size={18} aria-hidden />}
            onClick={onBack}
          />
        )}
        <h2 id={titleId} className="text-primary dial-h2-text">
          {title}
        </h2>
      </div>
      <div className="relative -mx-1 flex min-h-0 flex-col gap-4 overflow-y-auto px-1">{children}</div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        {onRemove && <GhostButton className="text-error" label={t(ButtonsI18nKey.Remove)} onClick={onRemove} />}
        <div className="ml-auto flex items-center gap-2">
          <GhostButton label={t(ButtonsI18nKey.Cancel)} onClick={onCancel} />
          <PrimaryButton label={t(ButtonsI18nKey.Apply)} disabled={isApplyDisabled} onClick={onApply} />
        </div>
      </div>
    </div>
  );
};

export default ChipPopupPanel;
