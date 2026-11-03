import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

interface ChildrenActivityTypeCellRendererParams extends ICellRendererParams {
  /** When false, child activities are not indented. Defaults to true. */
  shouldIndent?: boolean;
}

const ChildrenActivityTypeCellRenderer = ({ data, shouldIndent = true }: ChildrenActivityTypeCellRendererParams) => {
  const isIndented = shouldIndent && !!data?.parentActivityId;

  return (
    <div className={classNames('flex items-center min-w-0', isIndented && 'pl-6')}>
      <span>{data?.activityType}</span>
    </div>
  );
};
export default ChildrenActivityTypeCellRenderer;
