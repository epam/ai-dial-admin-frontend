import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

// Guards switching from a written mode (SQL, diverged JSON) to the Builder view: the written query
// cannot be displayed there, so confirming drops it and resets the builder to its starting point.
const DiscardQueryPopup: FC<Props> = ({ onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <DialConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(QueryBuilderI18nKey.DiscardQueryHeader)}
      description={t(QueryBuilderI18nKey.DiscardQueryDescription)}
      confirmLabel={t(ButtonsI18nKey.Discard)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default DiscardQueryPopup;
