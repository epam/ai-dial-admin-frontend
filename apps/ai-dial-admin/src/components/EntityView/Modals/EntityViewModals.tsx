import { FC } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ModalType } from './constants';
import EntityRolesModal from './EmptyRoles/EmptyRoles';
import DiscardModal from './Discard/Discard';

interface Props {
  isModalOpen: boolean;
  modalType?: ModalType;
  handleConfirm: (type: ModalType) => void;
  handleClose: () => void;
  handleCancel: (type: ModalType) => void;
}

const EntityViewModals: FC<Props> = ({ isModalOpen, modalType, handleConfirm, handleClose, handleCancel }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  return (
    <>
      {isModalOpen &&
        modalType === ModalType.entity &&
        createPortal(
          <DialConfirmationPopup
            open={isModalOpen}
            header={t(EntitiesI18nKey.SaveChangesTitle)}
            description={t(EntitiesI18nKey.SaveChangesDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.OpenWithoutSave)}
            disableConfirmButton={!isValid}
            onConfirm={() => handleConfirm(ModalType.entity)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.entity)}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.parameters &&
        createPortal(
          <DialConfirmationPopup
            open={isModalOpen}
            header={t(EntitiesI18nKey.SaveParametersTitle)}
            description={t(EntitiesI18nKey.SaveParametersDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.LeaveWithoutSave)}
            onConfirm={() => handleConfirm(ModalType.parameters)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.parameters)}
          />,
          document.body,
        )}
      {isModalOpen && modalType === ModalType.emptyRoles && (
        <EntityRolesModal
          onConfirm={() => handleConfirm(ModalType.emptyRoles)}
          onClose={() => handleClose()}
          onCancel={() => handleCancel(ModalType.emptyRoles)}
        />
      )}
      {isModalOpen && modalType === ModalType.discard && (
        <DiscardModal
          onConfirm={() => handleConfirm(ModalType.discard)}
          onClose={() => handleClose()}
          onCancel={() => handleCancel(ModalType.discard)}
        />
      )}
    </>
  );
};

export default EntityViewModals;
