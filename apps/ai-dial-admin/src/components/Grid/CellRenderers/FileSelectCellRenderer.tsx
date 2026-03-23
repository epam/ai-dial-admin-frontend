import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import FileSelectInput from '@/src/components/Common/FileSelectInput/FileSelectInput';

interface FileSelectCellRendererParams extends ICellRendererParams {
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
}

const FileSelectCellRenderer: FC<FileSelectCellRendererParams> = ({ value, data, colDef, node, onChange }) => {
  const onChangeValue = (value: string) => {
    onChange?.(value, data, colDef?.field as string, node.rowIndex as number);
  };
  return (
    <div className="w-full">
      <FileSelectInput value={value as string} onChangeValue={onChangeValue} inputClassName="h-8" />
    </div>
  );
};

export default FileSelectCellRenderer;
