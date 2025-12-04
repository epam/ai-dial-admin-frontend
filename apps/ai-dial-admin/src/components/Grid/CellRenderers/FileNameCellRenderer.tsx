import { DialFileName } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

const FileNameCellRenderer = (params: ICellRendererParams) => {
  const { extension, name } = params.data;

  return <DialFileName name={name.includes(extension) ? name : `${name}${extension}`} />;
};

export default FileNameCellRenderer;
