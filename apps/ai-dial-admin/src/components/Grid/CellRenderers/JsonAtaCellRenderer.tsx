import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';

import JsonAtaInput from '@/src/components/Common/JsonAtaInput/JsonAtaInput';
import { JsonataVariable } from '@/src/models/jsonata';

interface JsonAtaCellRendererParams extends ICellRendererParams {
  onChange?: (value: { expression: string; type?: string }, data: unknown, column: string, index?: number) => void;
  disabled?: boolean;
  responseSchema: JSONSchema7;
  variables?: JsonataVariable[];
}

const JsonAtaCellRenderer: FC<JsonAtaCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  disabled,
  responseSchema,
  variables,
}) => {
  const onChangeValue = (expression: string, type?: string) => {
    onChange?.({ expression, type }, data, colDef?.field as string, node.rowIndex as number);
  };
  return (
    <div className="h-8 w-full">
      <JsonAtaInput
        value={value}
        onChangeValue={onChangeValue}
        inputClassName="h-8"
        disabled={disabled}
        responseSchema={responseSchema}
        variables={variables}
      />
    </div>
  );
};

export default JsonAtaCellRenderer;
