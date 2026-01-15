import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';

interface JsonCellRendererParams extends ICellRendererParams {
  onChange?: (value: object, data: unknown, column: string, index?: number) => void;
  disableValidation: boolean;
}

const JsonEditorCellRenderer: FC<JsonCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  disableValidation,
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
      />
    </div>
  );
};

export default JsonEditorCellRenderer;
