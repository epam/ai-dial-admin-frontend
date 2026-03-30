import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

interface BooleanButtonCellRendererParams extends ICellRendererParams {
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean, data: { id: string }) => void;
  isReadonly?: boolean;
}

// TODO: use DialTag after implementing design system for tags

const BooleanButtonCellRenderer = ({
  value,
  trueLabel,
  falseLabel,
  data,
  onChange,
  isReadonly,
  setValue,
}: BooleanButtonCellRendererParams) => {
  const isRequired = !!value;

  const handleClick = () => {
    onChange(!isRequired, data);
    setValue?.(!isRequired);
  };

  return (
    <div className="w-full flex items-center justify-center">
      <button
        onClick={handleClick}
        disabled={isReadonly}
        className={classNames(
          'flex items-center gap-1 dial-tiny rounded p-1 h-[22px] text-primary bg-layer-3 border',
          !isRequired ? 'border-primary hover:bg-layer-4' : 'border-accent-primary hover:bg-accent-primary-alpha',
        )}
      >
        {isRequired ? trueLabel : falseLabel}
      </button>
    </div>
  );
};

export default BooleanButtonCellRenderer;
