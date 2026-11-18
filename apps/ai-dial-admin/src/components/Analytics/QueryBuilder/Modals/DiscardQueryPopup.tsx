'use client';

import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopupVariant, ConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

// Guards switching out of a written mode (SQL): the written query cannot survive the
// switch, so confirming drops it and resets the builder to its starting point.
const DiscardQueryPopup: FC<Props> = ({ onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(QueryBuilderI18nKey.DiscardQueryHeader)}
      description={t(QueryBuilderI18nKey.DiscardQueryDescriptionBuilder)}
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
