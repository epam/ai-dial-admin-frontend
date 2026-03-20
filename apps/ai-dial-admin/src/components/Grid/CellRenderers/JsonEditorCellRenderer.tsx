import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';

interface JsonCellRendererParams extends ICellRendererParams {
  onChange?: (value: object, data: unknown, column: string, index?: number) => void;
  disableValidation: boolean;
  disabled?: boolean;
}

const JsonEditorCellRenderer: FC<JsonCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  disableValidation,
  disabled,
}) => {
  const onChangeValue = (json: object) => {
    onChange?.(json, data, colDef?.field as string, node.rowIndex as number);
  };
  return (
    <div className="h-8 w-full">
      <JsonEditorInput
        value={value as object}
        onChangeValue={onChangeValue}
        inputClassName="h-8"
        disableValidation={disableValidation}
        disabled={disabled}
      />
    </div>
  );
};

export default JsonEditorCellRenderer;
