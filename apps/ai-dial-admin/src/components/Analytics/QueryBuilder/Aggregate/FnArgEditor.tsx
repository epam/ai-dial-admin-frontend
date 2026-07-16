import { FC } from 'react';

import { SelectOption } from '@epam/ai-dial-ui-kit';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { FieldOption, FnArgValue } from '@/src/models/analytics/query-builder';
import { QueryFunctionArg, QueryFunctionArgKind } from '@/src/models/analytics/query-function';

interface Props {
  id: string;
  arg: QueryFunctionArg;
  value: FnArgValue;
  // Field choices for an `expression` argument.
  fieldOptions: FieldOption[];
  onChange: (value: FnArgValue) => void;
}

// Clamp a completed numeric literal to the argument's inclusive bounds; intermediate input (empty,
// a lone trailing dot) is left untouched so typing is not fought.
const clampToBounds = (raw: string, min?: number, max?: number): string => {
  if (raw === '' || raw.endsWith('.')) return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (min != null && n < min) return String(min);
  if (max != null && n > max) return String(max);
  return raw;
};

// Renders one function argument's editor purely from its catalog descriptor: a field dropdown for an
// `expression` argument, a bounded numeric input for a literal number, and a select of allowed
// values (or a text input) for a string literal.
const FnArgEditor: FC<Props> = ({ id, arg, value, fieldOptions, onChange }) => {
  if (arg.kind === QueryFunctionArgKind.Expression) {
    return (
      <div className="min-w-0 flex-1">
        <CategorizedFieldDropdown
          id={id}
          options={fieldOptions}
          value={value.field}
          placeholder={arg.name}
          ariaLabel={arg.name}
          onSelect={(name) => onChange({ field: name })}
        />
      </div>
    );
  }

  const { min, max, allowed_values: allowedValues } = arg.constraints ?? {};

  if (arg.kind === QueryFunctionArgKind.StringLiteral && allowedValues?.length) {
    const options: SelectOption[] = allowedValues.map((v) => ({ value: v, label: v }));
    return (
      <div className="w-[104px] shrink-0">
        <CompactSelect
          ariaLabel={arg.name}
          options={options}
          value={value.literal ?? ''}
          onChange={(v) => onChange({ literal: v })}
        />
      </div>
    );
  }

  const isNumber = arg.kind === QueryFunctionArgKind.IntegerLiteral || arg.kind === QueryFunctionArgKind.NumericLiteral;
  const isDecimal = arg.kind === QueryFunctionArgKind.NumericLiteral;

  return (
    <CompactInput
      ariaLabel={arg.name}
      className={isNumber ? 'w-[64px] shrink-0' : 'w-[104px] shrink-0'}
      numeric={arg.kind === QueryFunctionArgKind.IntegerLiteral}
      decimal={isDecimal}
      value={value.literal ?? ''}
      placeholder={arg.name}
      onChange={(v) => onChange({ literal: isNumber ? clampToBounds(v, min, max) : v })}
    />
  );
};

export default FnArgEditor;
