import { useCallback } from 'react';
import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { DialSelect } from '@epam/ai-dial-ui-kit';

function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  options,
  value,
  multiple = false,
  onChange,
  label,
}: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue: optEmptyVal } = options;
  const emptyValue = multiple ? [] : '';

  const handleChange = useCallback(
    (value: string | string[]) => {
      return onChange(enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
    },
    [onChange, enumOptions, optEmptyVal],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <div>
      {label && <p className="small mb-2">{label}</p>}
      <DialSelect
        options={enumOptions?.map((o) => ({ ...o, value: o.value.toString() })) || []}
        value={selectedIndexes === void 0 ? emptyValue : selectedIndexes}
        onChange={handleChange}
      />
    </div>
  );
}

export default SelectWidget;
