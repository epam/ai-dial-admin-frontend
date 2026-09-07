import { FC } from 'react';

import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Common/FnArgEditor';
import { fieldDisplayName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { functionArgSummary } from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { ExpressionRow, FieldOption, FnArgValue, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';

interface Props {
  // Id prefix for the row's controls; each argument editor appends its own index.
  id: string;
  row: ExpressionRow;
  // Undefined when the row names a function the served catalog does not carry: the row still renders
  // (so it can be read and removed) but has no arguments to edit.
  fn?: QueryFunction;
  fields: AnalyticsEntityField[];
  fieldOptions: FieldOption[];
  color: QueryBuilderColor;
  onChangeArg: (index: number, value: FnArgValue) => void;
  onChangeAlias: (alias: string) => void;
  onRemove: () => void;
}

// An expanded scalar-function row: the collapsed summary chip, one argument editor per catalog
// argument, and the alias input that names the output column. Shared by the sections where a
// function can stand in place of a column — Group by and the row-mode projection. Alias policy stays
// with the owning section, because what a rename has to rewrite differs between them.
const FunctionRow: FC<Props> = ({ id, row, fn, fields, fieldOptions, color, onChangeArg, onChangeAlias, onRemove }) => {
  const t = useI18n();
  const args = fn ? functionArgSummary(fn, row.args, (name) => fieldDisplayName(fields, name)) : '';
  const summary = `${row.fn}(${args})${row.alias ? ` AS ${row.alias}` : ''}`;

  return (
    <ChipRow inline color={color} summary={summary} onRemove={onRemove}>
      {fn?.args.map((arg, i) => (
        <FnArgEditor
          key={`${row.id}-${i}`}
          id={`${id}-arg-${i}`}
          arg={arg}
          value={row.args[i] ?? {}}
          fieldOptions={fieldOptions}
          onChange={(value) => onChangeArg(i, value)}
        />
      ))}
      <CompactInput
        ariaLabel={t(QueryBuilderI18nKey.AliasPlaceholder)}
        className="min-w-[140px] flex-1"
        value={row.alias}
        placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
        onChange={onChangeAlias}
      />
    </ChipRow>
  );
};

export default FunctionRow;
