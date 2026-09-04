import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip, DialRadioButton } from '@epam/ai-dial-ui-kit';

import { FallbackIcon } from '@/src/components/Header/User/UserMenu/UserIcon';

export interface RadioNameCellRendererParams extends ICellRendererParams {
  /** Radio group name shared by every row, so the browser treats the column as one radio group. */
  groupName: string;
  idField?: string;
}

const iconClassName = 'pointer-events-none absolute inset-0 [.ag-row-hover_&]:hidden group-focus-within/radio:hidden';

const RadioNameCellRenderer = ({ value, data, node, groupName, idField = 'id' }: RadioNameCellRendererParams) => {
  const name = (value as string) ?? '';
  const rowId = (data?.[idField] as string) || node.id || name;
  const inputId = `${groupName}-${rowId}`;
  const isSelected = !!node.isSelected();

  const onSelect = () => node.setSelected(true);

  return (
    <div className="flex h-full items-center gap-2 overflow-hidden">
      <span className="group/radio relative flex size-7 shrink-0 items-center justify-center">
        <DialRadioButton
          name={groupName}
          value={rowId}
          inputId={inputId}
          className="size-[18px]"
          checked={isSelected}
          onChange={onSelect}
        />
        {!isSelected && <FallbackIcon name={name} seed={rowId} className={iconClassName} />}
      </span>

      <label htmlFor={inputId} className="min-w-0 cursor-pointer">
        <DialEllipsisTooltip className="small text-primary" text={name} />
      </label>
    </div>
  );
};

export default RadioNameCellRenderer;
