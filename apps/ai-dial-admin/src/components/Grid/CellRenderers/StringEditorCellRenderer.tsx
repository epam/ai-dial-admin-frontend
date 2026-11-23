import { FC, useCallback, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import StringEditorInput from '@/src/components/Common/StringEditorInput/StringEditorInput';

interface StringCellRendererParams extends ICellRendererParams {
  label: string;
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  disabled?: boolean;
}

const StringEditorCellRenderer: FC<StringCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  setValue,
  label,
  onChange,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState<string>(value == null ? '' : String(value));

  useEffect(() => {
    setLocalValue(value == null ? '' : String(value));
  }, [value]);

  const onChangeValue = useCallback(
    (nextValue: string) => {
      setLocalValue(nextValue);
      onChange?.(nextValue, data, colDef?.field as string, node.rowIndex as number);
      setValue?.(nextValue);
    },
    [onChange, data, colDef?.field, node.rowIndex, setValue],
  );

  return (
    <div className="h-8 w-full">
      <StringEditorInput
        value={localValue}
        label={label}
        onChangeValue={onChangeValue}
        disabled={disabled}
        required={!!data?.required}
        wrapperClassName="h-8 py-0"
      />
    </div>
  );
};

export default StringEditorCellRenderer;
