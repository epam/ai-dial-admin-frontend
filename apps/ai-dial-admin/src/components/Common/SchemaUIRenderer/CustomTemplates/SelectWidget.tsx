import { FC, useCallback } from 'react';

import { DialSelect } from '@epam/ai-dial-ui-kit';
import { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';

export const SelectWidget: FC<WidgetProps> = ({
  options,
  value,
  multiple = false,
  onChange,
  label,
  readonly,
  schema,
}) => {
  const { enumOptions } = options;
  const emptyValue = multiple ? [] : '';

  const handleChange = useCallback(
    (value: string | string[]) => {
      const val = enumOptions?.find((o) => o.value.toString() === value?.toString())?.value;
      return onChange(val);
    },
    [onChange, enumOptions],
  );

  const selectedIndexes = enumOptions?.find((o) => o.value.toString() === value?.toString())?.value.toString();

  return (
    <div className="flex flex-col w-full bg-layer-2 rounded p-[18px]">
      {label && <WidgetHeader title={label} defaultHeader={true} caption={schema.description} />}
      <DialSelect
        disabled={readonly}
        options={enumOptions?.map((o) => ({ ...o, value: o.value.toString() })) || []}
        value={selectedIndexes === void 0 ? emptyValue : selectedIndexes}
        onChange={handleChange}
        className="max-w-[600px]"
        listClassName="w-[600px]"
      />
    </div>
  );
};
