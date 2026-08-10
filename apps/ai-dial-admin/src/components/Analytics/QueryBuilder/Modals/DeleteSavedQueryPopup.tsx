import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Deleting your own saved query still asks once: it is yours to lose, which is a reason to confirm
// rather than a reason to skip confirming.
const DeleteSavedQueryPopup: FC<Props> = ({ name, onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <DialConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(QueryBuilderI18nKey.SavedQueryDeleteTitle)}
      description={t(QueryBuilderI18nKey.SavedQueryDeleteDescription, { name })}
      confirmLabel={t(ButtonsI18nKey.Delete)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default DeleteSavedQueryPopup;
