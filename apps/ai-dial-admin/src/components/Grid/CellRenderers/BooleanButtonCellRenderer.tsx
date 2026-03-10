import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

interface BooleanButtonCellRendererParams extends ICellRendererParams {
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean, data: { id: string }) => void;
  isReadonly?: boolean;
}

const BooleanButtonCellRenderer = ({
  value,
  trueLabel,
  falseLabel,
  data,
  onChange,
  isReadonly,
}: BooleanButtonCellRendererParams) => {
  const isRequired = !!value;

  const handleClick = () => {
    onChange(!isRequired, data);
  };

  return (
    <div className="w-full flex items-center justify-center">
      <button
        onClick={handleClick}
        disabled={isReadonly}
        className={classNames(
          'tiny p-2 rounded-[10px] select-none border',
          isRequired
            ? 'bg-accent-primary-alpha text-accent-primary border-accent-primary'
            : 'bg-layer-3 text-secondary border-tertiary',
        )}
      >
        {isRequired ? trueLabel : falseLabel}
      </button>
    </div>
  );
};

export default BooleanButtonCellRenderer;
