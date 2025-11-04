import { FC, useCallback } from 'react';

import { WidgetProps } from '@rjsf/utils';
import { DialSelect } from '@epam/ai-dial-ui-kit';

export const SelectWidget: FC<WidgetProps> = ({ options, value, multiple = false, onChange, label }) => {
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
    <div className="max-w-[600px]">
      {label && <p className="small mb-2">{label}</p>}
      <DialSelect
        options={enumOptions?.map((o) => ({ ...o, value: o.value.toString() })) || []}
        value={selectedIndexes === void 0 ? emptyValue : selectedIndexes}
        onChange={handleChange}
      />
    </div>
  );
};
