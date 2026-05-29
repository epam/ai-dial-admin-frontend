import { FC, useCallback, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';

interface JsonCellRendererParams extends ICellRendererParams {
  onChange?: (value: object, data: unknown, column: string, index?: number) => void;
  disableValidation: boolean;
  disabled?: boolean;
  skipRequired?: boolean;
}

const JsonEditorCellRenderer: FC<JsonCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  disableValidation,
  disabled,
  skipRequired,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const onChangeValue = useCallback(
    (json: object) => {
      setLocalValue(json);
      onChange?.(json, data, colDef?.field as string, node.rowIndex as number);
    },
    [onChange, data, colDef?.field, node.rowIndex],
  );

  const hasError = !skipRequired && data?.required && (localValue == null || localValue === '');

  return (
    <div className="h-8 w-full">
      <JsonEditorInput
        value={localValue as object}
        onChangeValue={onChangeValue}
        inputClassName={classNames('h-8', hasError && 'dial-input-error')}
        disableValidation={disableValidation}
        disabled={disabled}
      />
    </div>
  );
};

export default JsonEditorCellRenderer;
