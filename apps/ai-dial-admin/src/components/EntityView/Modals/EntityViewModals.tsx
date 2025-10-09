import { FC } from 'react';
import { createPortal } from 'react-dom';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ModalType } from './constants';
import EntityRolesModal from './EmptyRoles/EmptyRoles';

interface Props {
  isModalOpen: boolean;
  modalType?: ModalType;
  handleConfirm: (type: ModalType) => void;
  handleClose: () => void;
  handleCancel: (type: ModalType) => void;
}

const EntityViewModals: FC<Props> = ({ isModalOpen, modalType, handleConfirm, handleClose, handleCancel }) => {
  const t = useI18n();

  return (
    <>
      {isModalOpen &&
        modalType === ModalType.entity &&
        createPortal(
          <DialConfirmationPopup
            open={isModalOpen}
            title={t(EntitiesI18nKey.SaveChangesTitle)}
            description={t(EntitiesI18nKey.SaveChangesDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.OpenWithoutSave)}
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
            title={t(EntitiesI18nKey.SaveParametersTitle)}
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
    </>
  );
};

export default EntityViewModals;
