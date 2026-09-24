import { FC, useMemo } from 'react';

import { SelectOption } from '@epam/ai-dial-ui-kit';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import {
  argumentFunctionOptions,
  emptyArgs,
  functionByName,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { FieldDropdownMode, FieldOption, FnArgValue, FnCallValue } from '@/src/models/analytics/query-builder';
import { QueryFunction, QueryFunctionArg, QueryFunctionArgKind } from '@/src/models/analytics/query-function';

interface Props {
  id: string;
  arg: QueryFunctionArg;
  value: FnArgValue;
  // Field choices for an `expression` argument.
  fieldOptions: FieldOption[];
  // Off one level down: the editor renders a single level of nesting, so a nested call takes
  // columns only.
  isNestingOffered?: boolean;
  // Overrides the accessible name, so a nested argument is addressable apart from the outer one of
  // the same catalog name.
  label?: string;
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

// A stable empty catalog, so withholding nesting does not hand the memo a new array each render.
const EMPTY_CATALOG: QueryFunction[] = [];

interface ExpressionArgProps extends Omit<Props, 'arg' | 'label'> {
  name: string;
}

// A call taking no arguments (the current-instant function) renders as the picked call alone, which
// is what makes a bound relative to it authorable here.
const ExpressionArgEditor: FC<ExpressionArgProps> = ({
  id,
  name,
  value,
  fieldOptions,
  isNestingOffered = true,
  onChange,
}) => {
  const { state } = useQueryBuilder();
  const functions = useMemo(
    () => (isNestingOffered ? state.functions : EMPTY_CATALOG),
    [isNestingOffered, state.functions],
  );
  const functionOptions = useMemo(
    () => (functions.length ? argumentFunctionOptions(functions) : undefined),
    [functions],
  );
  const call = value.call;
  const calledFn = functionByName(functions, call?.fn ?? null);

  const onSelectFunction = (picked: string) => {
    const fn = functionByName(functions, picked);
    if (!fn) return;
    onChange({ call: { fn: fn.name, args: emptyArgs(fn) } });
  };

  const onChangeNestedArg = (index: number, nested: FnArgValue) => {
    if (!call) return;
    const args = call.args.map((arg, i) => (i === index ? nested : arg));
    const next: FnCallValue = { fn: call.fn, args };
    onChange({ call: next });
  };

  return (
    <div className="flex min-w-[128px] flex-1 flex-col gap-1">
      <CategorizedFieldDropdown
        id={id}
        mode={FieldDropdownMode.Picker}
        options={fieldOptions}
        value={call?.fn ?? value.field}
        functions={functionOptions}
        placeholder={name}
        ariaLabel={name}
        onSelect={(field) => onChange({ field })}
        onSelectFunction={onSelectFunction}
      />
      {!!calledFn?.args.length && (
        <div className="flex flex-wrap items-center gap-1.5">
          {calledFn.args.map((nestedArg, i) => (
            <FnArgEditor
              key={`${id}-nested-${i}`}
              id={`${id}-nested-${i}`}
              arg={nestedArg}
              label={`${call?.fn} ${nestedArg.name}`}
              value={call?.args[i] ?? {}}
              fieldOptions={fieldOptions}
              isNestingOffered={false}
              onChange={(nested) => onChangeNestedArg(i, nested)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Renders one function argument's editor purely from its catalog descriptor: a field (or nested
// call) editor for an `expression` argument, a bounded numeric input for a literal number, and a
// select of allowed values (or a text input) for a string literal.
const FnArgEditor: FC<Props> = ({ id, arg, value, fieldOptions, isNestingOffered, label, onChange }) => {
  const name = label ?? arg.name;

  if (arg.kind === QueryFunctionArgKind.Expression) {
    return (
      <ExpressionArgEditor
        id={id}
        name={name}
        value={value}
        fieldOptions={fieldOptions}
        isNestingOffered={isNestingOffered}
        onChange={onChange}
      />
    );
  }

  const { min, max, allowed_values: allowedValues } = arg.constraints ?? {};

  if (arg.kind === QueryFunctionArgKind.StringLiteral && allowedValues?.length) {
    const options: SelectOption[] = allowedValues.map((v) => ({ value: v, label: v }));
    return (
      <div className="w-[104px] shrink-0">
        <CompactSelect
          ariaLabel={name}
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
      ariaLabel={name}
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
