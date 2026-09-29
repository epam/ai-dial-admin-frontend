import { useEffect, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { SchemaFieldInputProps } from '@/src/components/Common/SchemaGrid/models';

interface TreeNameCellRendererParams extends ICellRendererParams {
  onToggleExpand: (data: unknown) => void;
  onChangeName: (value: string, data: unknown) => void;
  isReadonly?: boolean;
  /** Native attributes for the name input; the ones the renderer sets itself always win. */
  inputProps?: SchemaFieldInputProps;
}

const TreeNameCellRenderer = ({
  data,
  isReadonly,
  onToggleExpand,
  onChangeName,
  setValue,
  inputProps,
}: TreeNameCellRendererParams) => {
  const [inputValue, setInputValue] = useState(data?.name || '');

  useEffect(() => {
    setInputValue(data?.name || '');
  }, [data?.name]);

  if (!data) return null;

  const { type, expanded, depth, itemsType } = data;
  const hasChildren = type === 'object' || (type === 'array' && (itemsType === 'object' || !itemsType));

  return (
    <div className="flex items-center h-full gap-1" style={{ paddingLeft: depth * 24 }}>
      <div
        className={classNames(
          'flex items-center justify-center w-[18px] h-[18px] shrink-0 rounded',
          hasChildren && 'cursor-pointer hover:bg-layer-3',
        )}
        onClick={() => hasChildren && onToggleExpand(data)}
      >
        {hasChildren ? (
          expanded ? (
            <IconChevronDown size={14} className="text-secondary" />
          ) : (
            <IconChevronRight size={14} className="text-secondary" />
          )
        ) : (
          <span className="size-1.5 rounded-full bg-secondary" />
        )}
      </div>
      {!isReadonly ? (
        <input
          {...inputProps}
          type="text"
          value={inputValue}
          placeholder="field_name"
          onChange={(e) => {
            setInputValue(e.target.value);
            setValue?.(e.target.value);
            onChangeName(e.target.value, data);
          }}
          className="leading-[18px] h-[32px] dial-input px-2 py-1 flex-1 min-w-0"
        />
      ) : (
        <div>{inputValue}</div>
      )}
    </div>
  );
};
export default TreeNameCellRenderer;
