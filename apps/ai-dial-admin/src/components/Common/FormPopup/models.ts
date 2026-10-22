export interface FormPopupButtonsParams {
  cancelLabel: string;
  submitLabel: string;
  isSubmitDisabled?: boolean;
  submitClassName?: string;
  onCancel: () => void;
  onSubmit: () => void;
}
