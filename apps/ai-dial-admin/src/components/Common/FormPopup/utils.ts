import { ButtonProps, ButtonVariant } from '@epam/ai-dial-ui-kit';

import { FormPopupButtonsParams } from '@/src/components/Common/FormPopup/models';

export const getFormPopupButtons = ({
  cancelLabel,
  submitLabel,
  isSubmitDisabled = false,
  submitClassName,
  onCancel,
  onSubmit,
}: FormPopupButtonsParams): ButtonProps[] => [
  { label: cancelLabel, onClick: () => onCancel() },
  {
    label: submitLabel,
    variant: ButtonVariant.Primary,
    className: submitClassName,
    disabled: isSubmitDisabled,
    onClick: () => onSubmit(),
  },
];
