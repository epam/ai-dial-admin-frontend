import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDashboardPopup: FC<Props> = ({ name, onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open
      header={t(CustomDashboardsI18nKey.DeleteDashboard)}
      description={t(CustomDashboardsI18nKey.DeleteDescription, { name })}
      confirmLabel={t(ButtonsI18nKey.Delete)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default DeleteDashboardPopup;
