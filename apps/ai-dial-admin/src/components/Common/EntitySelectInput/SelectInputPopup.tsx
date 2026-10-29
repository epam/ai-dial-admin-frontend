import { FC, ReactNode } from 'react';

import { Label, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import OverflowValueTooltip from '@/src/components/Common/OverflowValueTooltip/OverflowValueTooltip';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** The value shown in the input; a picker passes the already-normalised reference. */
  displayValue: string;
  header: string;
  portalId: string;
  isOpen: boolean;
  isConfirmDisabled: boolean;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  isEditable?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onConfirm: () => void;
  onChangeValue: (value: string) => void;
  children: ReactNode;
}

/** The input-plus-popup frame shared by every picker; the caller owns the open state and the popup body. */
const SelectInputPopup: FC<Props> = ({
  displayValue,
  header,
  portalId,
  isOpen,
  isConfirmDisabled,
  label,
  elementId,
  disabled,
  inputClassName,
  isEditable = true,
  onOpen,
  onClose,
  onConfirm,
  onChangeValue,
  children,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <div className="flex flex-col gap-y-1">
      {label && <Label label={label} htmlFor={elementId} />}
      <OverflowValueTooltip text={displayValue}>
        <InputPopup
          disabled={disabled || isReadOnlyAdmin}
          open={isOpen}
          selectedValue={displayValue}
          onOpen={onOpen}
          emptyValueText={t(BasicI18nKey.None)}
          inputClassName={inputClassName}
          editable={isEditable}
          onValueChange={onChangeValue}
        >
          <Popup
            header={header}
            portalId={portalId}
            open={isOpen}
            onClose={onClose}
            className="md:h-[800px]"
            size={PopupSize.Lg}
            mainButtons={getFormPopupButtons({
              cancelLabel: t(ButtonsI18nKey.Cancel),
              submitLabel: t(ButtonsI18nKey.Confirm),
              isSubmitDisabled: isConfirmDisabled,
              onCancel: onClose,
              onSubmit: onConfirm,
            })}
          >
            {children}
          </Popup>
        </InputPopup>
      </OverflowValueTooltip>
    </div>
  );
};

export default SelectInputPopup;
