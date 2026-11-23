import { FC, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { ElementSize, PasswordInput } from '@epam/ai-dial-ui-kit';

interface EditablePasswordCellRendererParams extends ICellRendererParams {
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  /** Accessible name of the input for a row, so each secret field is told apart by screen readers. */
  getInputLabel?: (data: unknown) => string;
}

/**
 * An editable, masked grid cell for a secret. Separate from `EditableCellRenderer` on purpose: that one prints
 * its value in an overflow tooltip, which would show the secret in clear text.
 */
const EditablePasswordCellRenderer: FC<EditablePasswordCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  getInputLabel,
}) => {
  const [inputValue, setInputValue] = useState<string>(value ?? '');

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const onChangeValue = (newValue?: string) => {
    const nextValue = newValue ?? '';
    setInputValue(nextValue);
    onChange?.(nextValue, data, colDef?.field as string, node?.rowIndex as number);
  };

  return (
    <div className="flex h-full w-full items-center">
      <PasswordInput
        id={`client-secret-${node?.id}`}
        size={ElementSize.Small}
        autoComplete="new-password"
        aria-label={getInputLabel?.(data)}
        value={inputValue}
        onChange={onChangeValue}
        wrapperClassName="h-8"
      />
    </div>
  );
};

export default EditablePasswordCellRenderer;
