import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import FileSelectInput from '@/src/components/Common/FileSelectInput/FileSelectInput';
import { ApplicationRoute } from '@/src/types/routes';

interface FileSelectCellRendererParams extends ICellRendererParams {
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  view?: ApplicationRoute;
  id?: string;
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
}) => {
  const onChangeValue = (value: string) => {
    onChange?.(value, data, colDef?.field as string, node.rowIndex as number);
    setValue?.(value);
  };
  return (
    <div className="w-full">
      <FileSelectInput view={view} id={id} value={value as string} onChangeValue={onChangeValue} inputClassName="h-8" />
    </div>
  );
};

export default FileSelectCellRenderer;
