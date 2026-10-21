import { ConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
  onCancel: () => void;
}

const EntityRolesModal: FC<Props> = ({ onConfirm, onClose, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      open={true}
      header={t(RolesI18nKey.SaveWithEmptyRolesTitle)}
      confirmLabel={t(ButtonsI18nKey.Save)}
      cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
      confirmClassName="lg:!max-w-[440px]"
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onCancel}
    >
      <div className="text-secondary dial-small-paragraph-text px-6 py-4">
        <p className="mb-2">{t(RolesI18nKey.SaveWithEmptyRolesDescription)}</p>
        <p className="dial-small-semi-text">{t(RolesI18nKey.SaveProceedWithConfiguration)}</p>
      </div>
    </ConfirmationPopup>,
    document.body,
  );
};

export default EntityRolesModal;
