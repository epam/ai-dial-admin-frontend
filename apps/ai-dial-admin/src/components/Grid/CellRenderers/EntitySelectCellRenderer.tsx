import { FC, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import EntitySelectInput from '@/src/components/Common/EntitySelectInput/EntitySelectInput';
import { EntitySelectType } from '@/src/components/Common/EntitySelectInput/models';

interface EntitySelectCellRendererParams extends ICellRendererParams {
  entityType: EntitySelectType;
  onChange?: (value: string, data: unknown, column: string, index?: number) => void;
  isReadonly?: boolean;
}

const EntitySelectCellRenderer: FC<EntitySelectCellRendererParams> = ({
  entityType,
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
      <EntitySelectInput
        entityType={entityType}
        value={localValue}
        onChangeValue={onChangeValue}
        inputClassName="h-8"
        disabled={isReadonly}
      />
    </div>
  );
};

export default EntitySelectCellRenderer;
