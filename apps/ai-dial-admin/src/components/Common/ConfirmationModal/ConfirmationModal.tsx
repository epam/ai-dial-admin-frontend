import { FC, ReactNode } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import Loader from '@/src/components/Common/Loader/Loader';

interface Props {
  heading: string;
  description?: string;
  modalState: PopUpState;
  confirmClassName?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
  dataTestId?: string;
  containerClassName?: string;
}

const ConfirmationModal: FC<Props> = ({
  onConfirm,
  heading,
  modalState,
  description,
  onClose,
  onCancel,
  confirmClassName,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  children,
  dataTestId,
  containerClassName,
}) => {
  const t = useI18n();

  return (
    <Popup
      dataTestId={dataTestId}
      onClose={onClose}
      heading={heading}
      portalId="ConfirmationModal"
      state={modalState}
      dividers={false}
      containerClassName={containerClassName}
    >
      {isLoading ? (
        <div className="px-6 py-4 h-[120px]">
          <Loader size={50} />
        </div>
      ) : children != null ? (
        <>{children}</>
      ) : (
        <div className="text-secondary small-150 px-6 py-4">{description}</div>
      )}
      {!isLoading && (
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <Button
            cssClass="secondary"
            title={cancelLabel || t(ButtonsI18nKey.Cancel)}
            onClick={() => (onCancel ? onCancel() : onClose())}
          />

          <Button cssClass={`primary ${confirmClassName || ''}`} title={confirmLabel} onClick={() => onConfirm()} />
        </div>
      )}
    </Popup>
  );
};

export default ConfirmationModal;
