import { FC, ReactNode } from 'react';
import { ButtonVariant, DialButton, DialLoader } from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  heading: string;
  description?: string;
  modalState: PopUpState;
  confirmClassName?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  disableConfirmButton?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
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
  containerClassName,
  disableConfirmButton,
}) => {
  const t = useI18n();

  return (
    <Popup
      onClose={onClose}
      heading={heading}
      portalId="ConfirmationModal"
      state={modalState}
      dividers={false}
      containerClassName={containerClassName}
    >
      {isLoading ? (
        <div className="px-6 py-4 h-[120px]">
          <DialLoader size={50} />
        </div>
      ) : children != null ? (
        <>{children}</>
      ) : (
        <div className="text-secondary small-150 px-6 py-4">{description}</div>
      )}
      {!isLoading && (
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton
            variant={ButtonVariant.Secondary}
            title={cancelLabel || t(ButtonsI18nKey.Cancel)}
            onClick={() => (onCancel ? onCancel() : onClose())}
          />

          <DialButton
            variant={ButtonVariant.Primary}
            cssClass={confirmClassName}
            title={confirmLabel}
            disable={disableConfirmButton}
            onClick={() => onConfirm()}
          />
        </div>
      )}
    </Popup>
  );
};

export default ConfirmationModal;
