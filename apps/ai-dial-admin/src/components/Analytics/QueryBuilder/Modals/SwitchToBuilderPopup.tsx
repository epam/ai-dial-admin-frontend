'use client';

import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

// Guards switching out of a written mode (SQL): the written query cannot survive the
// switch, so confirming replaces it with a builder query starting from the builder's starting point.
const SwitchToBuilderPopup: FC<Props> = ({ onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      open={true}
      header={t(QueryBuilderI18nKey.SwitchToBuilderHeader)}
      description={t(QueryBuilderI18nKey.SwitchToBuilderDescription)}
      confirmLabel={t(QueryBuilderI18nKey.SwitchToBuilder)}
      cancelLabel={t(QueryBuilderI18nKey.StayInSql)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default SwitchToBuilderPopup;
