import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { FC } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  modalState: PopUpState;
  onConfirm: () => void;
  onClose: () => void;
  onCancel: () => void;
}

const EntityRolesModal: FC<Props> = ({ modalState, onConfirm, onClose, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationModal
      modalState={modalState}
      heading={t(RolesI18nKey.SaveWithEmptyRolesTitle)}
      confirmLabel={t(ButtonsI18nKey.Save)}
      cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
      containerClassName="lg:!max-w-[440px]"
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onCancel}
    >
      <div className="text-secondary small-150 px-6 py-4">
        <p className="mb-2">{t(RolesI18nKey.SaveWithEmptyRolesDescription)}</p>
        <p className="small-text-semi">{t(RolesI18nKey.SaveProceedWithConfiguration)}</p>
      </div>
    </ConfirmationModal>,
    document.body,
  );
};

export default EntityRolesModal;
