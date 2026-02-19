import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
  onCancel: () => void;
}

const DiscardModal: FC<Props> = ({ onConfirm, onClose, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <DialConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(EntitiesI18nKey.DiscardChanges)}
      description={t(EntitiesI18nKey.DiscardChangesDescription)}
      confirmLabel={t(ButtonsI18nKey.Discard)}
      cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default DiscardModal;
