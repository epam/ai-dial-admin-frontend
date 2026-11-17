import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

const ResetQueryPopup: FC<Props> = ({ onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      open={true}
      header={t(QueriesI18nKey.ResetQueryHeader)}
      description={t(QueriesI18nKey.ResetQueryDescription)}
      confirmLabel={t(ButtonsI18nKey.Reset)}
      cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default ResetQueryPopup;
