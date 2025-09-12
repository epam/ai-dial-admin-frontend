import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { FC } from 'react';
import { createPortal } from 'react-dom';
import { ModalType } from './constants';
import EntityRolesModal from './EmptyRoles/EmptyRoles';

interface Props {
  modalState: PopUpState;
  modalType?: ModalType;
  handleConfirm: (type: ModalType) => void;
  handleClose: () => void;
  handleCancel: (type: ModalType) => void;
}

const EntityViewModals: FC<Props> = ({ modalState, modalType, handleConfirm, handleClose, handleCancel }) => {
  const t = useI18n();

  return (
    <>
      {modalState === PopUpState.Opened &&
        modalType === ModalType.entity &&
        createPortal(
          <ConfirmationModal
            modalState={modalState}
            heading={t(EntitiesI18nKey.SaveChangesTitle)}
            description={t(EntitiesI18nKey.SaveChangesDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.OpenWithoutSave)}
            onConfirm={() => handleConfirm(ModalType.entity)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.entity)}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.parameters &&
        createPortal(
          <ConfirmationModal
            modalState={modalState}
            heading={t(EntitiesI18nKey.SaveParametersTitle)}
            description={t(EntitiesI18nKey.SaveParametersDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.LeaveWithoutSave)}
            onConfirm={() => handleConfirm(ModalType.parameters)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.parameters)}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened && modalType === ModalType.emptyRoles && (
        <EntityRolesModal
          modalState={modalState}
          onConfirm={() => handleConfirm(ModalType.emptyRoles)}
          onClose={() => handleClose()}
          onCancel={() => handleCancel(ModalType.emptyRoles)}
        />
      )}
    </>
  );
};

export default EntityViewModals;
