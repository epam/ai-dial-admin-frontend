import { FC, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import FileSelectInput from '@/src/components/Common/FileSelectInput/FileSelectInput';
import { ApplicationRoute } from '@/src/types/routes';

interface FileSelectCellRendererParams extends ICellRendererParams {
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  view?: ApplicationRoute;
  id?: string;
  isReadonly?: boolean;
}

const FileSelectCellRenderer: FC<FileSelectCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
  view,
  id,
  setValue,
  isReadonly,
}) => {
  const incomingValue = value as string;
  const [localValue, setLocalValue] = useState(incomingValue);

  useEffect(() => {
    setLocalValue(incomingValue);
  }, [incomingValue, data]);

  const onChangeValue = (value: string) => {
    setLocalValue(value);
    onChange?.(value, data, colDef?.field as string, node.rowIndex as number);
    setValue?.(value);
  };
  return (
    <div className="w-full">
      <FileSelectInput
        view={view}
        id={id}
        value={localValue}
        onChangeValue={onChangeValue}
        inputClassName="h-8"
        disabled={isReadonly}
      />
    </div>
  );
};

export default FileSelectCellRenderer;
