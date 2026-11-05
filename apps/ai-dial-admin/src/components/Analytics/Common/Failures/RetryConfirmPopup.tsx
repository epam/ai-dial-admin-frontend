'use client';

import { FC } from 'react';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title: string;
  body: string;
  caveats: string[];
  confirmLabel: string;
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const RetryConfirmPopup: FC<Props> = ({
  title,
  body,
  caveats,
  confirmLabel,
  isConfirmDisabled,
  onConfirm,
  onClose,
}) => {
  const t = useI18n();

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Info}
      header={title}
      description={
        <div className="flex flex-col gap-y-2">
          <span>{body}</span>
          {caveats.map((caveat) => (
            <span key={caveat} className="text-secondary">
              {caveat}
            </span>
          ))}
        </div>
      }
      confirmLabel={confirmLabel}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableConfirmButton={isConfirmDisabled}
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onClose}
    />
  );
};

export default RetryConfirmPopup;
