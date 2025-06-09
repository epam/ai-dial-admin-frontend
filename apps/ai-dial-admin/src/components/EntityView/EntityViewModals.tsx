import { PopUpState } from '@/src/types/pop-up';
import { FC } from 'react';
import { createPortal } from 'react-dom';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

export enum ModalType {
  entity = 'saveEntity',
  parameters = 'saveParameters',
  emptyRoles = 'emptyRoles',
}

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
            heading={t(BasicI18nKey.SaveChangesTitle)}
            description={t(BasicI18nKey.SaveChangesDescription)}
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
            heading={t(BasicI18nKey.SaveParametersTitle)}
            description={t(BasicI18nKey.SaveParametersDescription)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.LeaveWithoutSave)}
            onConfirm={() => handleConfirm(ModalType.parameters)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.parameters)}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.emptyRoles &&
        createPortal(
          <ConfirmationModal
            modalState={modalState}
            heading={t(BasicI18nKey.SaveWithEmptyRolesTitle)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
            containerClassName="lg:!max-w-[440px]"
            onConfirm={() => handleConfirm(ModalType.emptyRoles)}
            onClose={() => handleClose()}
            onCancel={() => handleCancel(ModalType.emptyRoles)}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p className="mb-2">{t(BasicI18nKey.SaveWithEmptyRolesDescription)}</p>
              <p className="small-text-semi">{t(BasicI18nKey.SaveProceedWithConfiguration)}</p>
            </div>
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default EntityViewModals;
