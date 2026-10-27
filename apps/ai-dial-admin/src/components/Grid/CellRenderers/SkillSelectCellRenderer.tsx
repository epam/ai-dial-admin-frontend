import { FC, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import SkillSelectInput from '@/src/components/Common/SkillSelectInput/SkillSelectInput';

interface SkillSelectCellRendererParams extends ICellRendererParams {
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  isReadonly?: boolean;
}

const SkillSelectCellRenderer: FC<SkillSelectCellRendererParams> = ({
  value,
  data,
  colDef,
  node,
  onChange,
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
    <div className="w-full min-w-0">
      <SkillSelectInput value={localValue} onChangeValue={onChangeValue} inputClassName="h-8" disabled={isReadonly} />
    </div>
  );
};

export default SkillSelectCellRenderer;
