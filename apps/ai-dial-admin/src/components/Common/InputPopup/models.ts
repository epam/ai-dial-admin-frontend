import { ReactNode } from 'react';

export interface InputPopupProps {
  open?: boolean;
  selectedValue?: string | string[];
  children: ReactNode;
  onOpen: () => void;
  disabled?: boolean;
  inputClassName?: string;
  wrapperClassName?: string;
  placeholder?: string;
  elementId?: string;
  errorText?: string;
  invalid?: boolean;
  emptyValueText?: string;
  editable?: boolean;
  onValueChange?: (value: string) => void;
  collapseTagOverflow?: boolean;
  iconBefore?: ReactNode;
}
