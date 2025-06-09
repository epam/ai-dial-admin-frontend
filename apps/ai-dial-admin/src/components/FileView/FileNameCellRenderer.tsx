import { ICellRendererParams } from 'ag-grid-community';
import { getIcon } from '@/src/utils/files/icon';

const FileNameCellRenderer = (params: ICellRendererParams) => {
  const { extension, name } = params.data;
  const icon = getIcon(extension);
  return (
    <div className="flex items-center">
      {icon && <span className="mr-2 text-secondary">{icon}</span>}
      {name}
    </div>
  );
};

export default FileNameCellRenderer;
