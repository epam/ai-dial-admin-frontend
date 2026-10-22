import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { translateSqlToQuery } from '@/src/app/[lang]/queries/actions';
import PipelineFilterField from '@/src/components/Analytics/Pipelines/Filter/PipelineFilterField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryValueType,
} from '@/src/models/analytics/query';

vi.mock('@/src/app/[lang]/queries/actions');

// The 2.0 select keeps its options in an overlay, so it is swapped for a native select the options can be read
// out of and picked from — the stub `GroupKeysEditor.spec.tsx` uses, plus `multiple`.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Select: ({ id, labelProps, ariaLabel, options, value, multiple, onChange }: any) => (
    <select
      id={id}
      aria-label={`${labelProps?.label ?? ariaLabel} ${id}`}
      multiple={multiple}
      value={value}
      onChange={(e) =>
        onChange(multiple ? Array.from(e.target.selectedOptions).map((option) => option.value) : e.target.value)
      }
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const field = (name: string, type: AnalyticsFieldType, enumValues?: string[]): AnalyticsEntityField => ({
  name,
  type,
  source: name,
  enum_values: enumValues,
});

const FIELDS = [
  field('deployment', AnalyticsFieldType.String),
  field('status_code', AnalyticsFieldType.Integer),
  field('status', AnalyticsFieldType.Enum, ['ok', 'failed']),
];

const eq = (name: string, value: string): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value },
  ],
});

const parsedAs = (filter: QueryFilterNode) =>
  vi
    .mocked(translateSqlToQuery)
    .mockResolvedValue({ success: true, response: { query: { entity: 'usage', mode: QueryMode.Row, filter } } });

interface HarnessProps {
  initial?: string;
  // A value the form sets from outside the field, as Discard or the JSON editor does.
  external?: string;
  onChange: (value?: string) => void;
}

const Harness = ({ initial, external, onChange }: HarnessProps) => {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setValue(external)}>
        set from outside
      </button>
      <PipelineFilterField
        value={value}
        sourceName="usage"
        fields={FIELDS}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </>
  );
};

const renderField = (initial?: string, external?: string) => {
  const onChange = vi.fn();
  render(<Harness initial={initial} external={external} onChange={onChange} />);
  return { onChange, user: userEvent.setup() };
};

// A read the test settles by hand, to act while it is still in flight.
const deferredRead = () => {
  let settle: (filter: QueryFilterNode) => void = () => undefined;
  vi.mocked(translateSqlToQuery).mockReturnValueOnce(
    new Promise((resolve) => {
      settle = (filter) =>
        resolve({ success: true, response: { query: { entity: 'usage', mode: QueryMode.Row, filter } } });
    }),
  );
  return (filter: QueryFilterNode) => settle(filter);
};

const builderRadio = () => screen.getByRole('radio', { name: AnalyticsPipelinesI18nKey.FilterViewBuilder });
const sqlRadio = () => screen.getByRole('radio', { name: AnalyticsPipelinesI18nKey.FilterViewSql });
const sqlText = () => screen.getByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter });
const addCondition = () => screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition });
const columnSelect = (i: number) =>
  screen.getByLabelText(`${AnalyticsPipelinesI18nKey.FilterColumn} filter-condition-column-${i}`);
const operatorSelect = (i: number) =>
  screen.getByLabelText(`${AnalyticsPipelinesI18nKey.FilterOperator} filter-condition-operator-${i}`);
const valueOf = (i: number) =>
  screen.getByLabelText(`${AnalyticsPipelinesI18nKey.FilterValue} filter-condition-value-${i}`, { exact: false });
const optionsOf = (select: HTMLElement) =>
  Array.from(select.querySelectorAll('option')).map((option) => option.getAttribute('value'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PipelineFilterField — a new filter', () => {
  test('opens in the Builder view with no conditions', async () => {
    renderField();

    expect(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition })).toBeTruthy();
    expect(builderRadio()).toBeChecked();
    expect(screen.queryByLabelText(/filter-condition-column/)).toBeNull();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });

  test('writes the conditions as a SQL predicate', async () => {
    const { onChange, user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');
    await user.type(screen.getByRole('textbox', { name: AnalyticsPipelinesI18nKey.FilterValue }), "o'neil");
    await user.click(addCondition());
    await user.selectOptions(columnSelect(1), 'status_code');
    await user.selectOptions(operatorSelect(1), QueryOperator.In);
    await user.type(screen.getAllByRole('textbox', { name: AnalyticsPipelinesI18nKey.FilterValue })[1], '200, 201');

    expect(onChange).toHaveBeenLastCalledWith(`"deployment" = 'o''neil' AND "status_code" IN (200, 201)`);

    await user.click(sqlRadio());

    expect(sqlText()).toHaveValue(`"deployment" = 'o''neil' AND "status_code" IN (200, 201)`);
  });

  test('draws the labels on the first condition only, and names every control', async () => {
    const { user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');
    await user.click(addCondition());
    await user.selectOptions(columnSelect(1), 'deployment');

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.FilterValue)).toHaveLength(1);
    expect(screen.getAllByRole('textbox', { name: AnalyticsPipelinesI18nKey.FilterValue })).toHaveLength(2);
    expect(screen.getAllByRole('group', { name: AnalyticsPipelinesI18nKey.FilterCondition })).toHaveLength(2);
  });

  test('writes is empty with no value control', async () => {
    const { onChange, user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');
    await user.selectOptions(operatorSelect(0), 'is_empty');

    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.FilterValue })).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith('"deployment" IS NULL');
  });

  test('withholds contains from an enum column and offers its values', async () => {
    const { user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'status');

    expect(optionsOf(operatorSelect(0))).not.toContain(QueryOperator.Ico);
    expect(optionsOf(operatorSelect(0))).not.toContain(QueryOperator.Inc);
    expect(optionsOf(valueOf(0))).toEqual(['ok', 'failed']);
  });

  test('counts a condition with no value as not applied', async () => {
    const { onChange, user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FilterSkipped)).toHaveAttribute('aria-live', 'polite');
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('refuses a LIKE wildcard in a contains value', async () => {
    const { onChange, user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');
    await user.selectOptions(operatorSelect(0), QueryOperator.Ico);
    await user.type(screen.getByRole('textbox', { name: AnalyticsPipelinesI18nKey.FilterValue }), 'a_b');

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FilterWildcard)).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('sends no filter once every condition is deleted', async () => {
    const { onChange, user } = renderField();

    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');
    await user.selectOptions(operatorSelect(0), 'is_not_empty');
    await user.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(screen.queryByLabelText(/filter-condition-column/)).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

describe('PipelineFilterField — an existing filter', () => {
  test('opens a flat filter in the Builder view', async () => {
    parsedAs({ op: QueryLogicalOperator.Or, args: [eq('deployment', 'gpt-4o'), eq('status_code', '200')] });
    renderField(`"deployment" = 'gpt-4o' OR "status_code" = 200`);

    expect(await screen.findByLabelText(/filter-condition-column-1/)).toBeTruthy();
    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.FilterMatch} pipeline-filter-match`)).toHaveValue('any');
    expect(translateSqlToQuery).toHaveBeenCalledWith(
      `SELECT 1 FROM usage WHERE "deployment" = 'gpt-4o' OR "status_code" = 200`,
    );
  });

  // The service folds an OR of equalities on one column into one `in`, which flattens the group around it.
  test('opens a folded OR of equalities as one in condition', async () => {
    parsedAs({
      op: QueryLogicalOperator.And,
      args: [
        {
          op: QueryOperator.In,
          args: [
            { type: QueryExprType.Field, name: 'deployment' },
            {
              type: QueryExprType.Array,
              items: [
                { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
                { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'b' },
              ],
            },
          ],
        },
        eq('status_code', '200'),
      ],
    });
    const { onChange } = renderField(`("deployment" = 'a' OR "deployment" = 'b') AND "status_code" = 200`);

    expect(await screen.findByDisplayValue('a, b')).toBeTruthy();
    expect(operatorSelect(0)).toHaveValue(QueryOperator.In);
    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.FilterMatch} pipeline-filter-match`)).toHaveValue('all');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not rewrite the filter it opened', async () => {
    parsedAs(eq('deployment', 'gpt-4o'));
    const { onChange } = renderField(`deployment='gpt-4o'`);

    expect(await screen.findByLabelText(/filter-condition-column-0/)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('opens a filter the builder cannot show in the SQL view and says why', async () => {
    parsedAs({
      op: QueryLogicalOperator.And,
      args: [eq('a', '1'), { op: QueryLogicalOperator.Or, args: [eq('b', '2')] }],
    });
    renderField(`a = '1' AND (b = '2' OR lower(c) = 'x')`);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNotFlat)).toBeTruthy();
    expect(sqlText()).toHaveValue(`a = '1' AND (b = '2' OR lower(c) = 'x')`);
    expect(builderRadio()).toBeDisabled();
  });

  test('keeps an in list with a comma inside a value in the SQL view', async () => {
    parsedAs({
      op: QueryOperator.In,
      args: [
        { type: QueryExprType.Field, name: 'deployment' },
        {
          type: QueryExprType.Array,
          items: [
            { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a,b' },
            { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'c' },
          ],
        },
      ],
    });
    renderField(`"deployment" IN ('a,b', 'c')`);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNotFlat)).toBeTruthy();
    expect(sqlText()).toHaveValue(`"deployment" IN ('a,b', 'c')`);
    expect(builderRadio()).toBeDisabled();
  });

  test('opens a filter the service cannot read in the SQL view', async () => {
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, errorMessage: 'bad' });
    renderField('nonsense ===');

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableUnparsed)).toBeTruthy();
    expect(builderRadio()).toBeDisabled();
  });

  test('offers the builder again once the SQL is edited, and rereads it', async () => {
    parsedAs({ op: QueryLogicalOperator.Not, args: [{ op: QueryLogicalOperator.And, args: [eq('a', '1')] }] });
    const { user } = renderField(`NOT (a = '1')`);
    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNotFlat)).toBeTruthy();

    await user.clear(sqlText());
    await user.type(sqlText(), `a = '2'`);
    await waitFor(() => expect(builderRadio()).toBeEnabled());
    parsedAs(eq('a', '2'));
    await user.click(builderRadio());

    expect(await screen.findByDisplayValue('2')).toBeTruthy();
  });

  test('rereads the SQL when switching back to the builder', async () => {
    parsedAs(eq('deployment', 'gpt-4o'));
    const { user } = renderField(`"deployment" = 'gpt-4o'`);
    expect(await screen.findByDisplayValue('gpt-4o')).toBeTruthy();

    await user.click(sqlRadio());
    await user.clear(sqlText());
    await user.type(sqlText(), `"deployment" = 'gpt-5'`);
    parsedAs(eq('deployment', 'gpt-5'));
    await user.click(builderRadio());

    expect(await screen.findByDisplayValue('gpt-5')).toBeTruthy();
  });
});

describe('PipelineFilterField — reads and edits racing', () => {
  test('settles the reading caption when the text is cleared while a read is in flight', async () => {
    deferredRead();
    const { user } = renderField(`"deployment" = 'a'`);
    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterReading)).toBeTruthy();

    await user.clear(sqlText());

    expect(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition })).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FilterReading)).toBeNull();
    expect(builderRadio()).toBeEnabled();
  });

  test('sends one read while the first is in flight, however much is typed', async () => {
    const settle = deferredRead();
    const { user } = renderField(`"deployment" = 'a'`);
    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterReading)).toBeTruthy();

    await user.type(sqlText(), ' ');
    await user.type(sqlText(), ' ');
    expect(translateSqlToQuery).toHaveBeenCalledOnce();

    parsedAs(eq('deployment', 'a'));
    settle(eq('deployment', 'a'));
    expect(await screen.findByDisplayValue('a')).toBeTruthy();
  });

  test('keeps an edit made while a read of an outside change is in flight', async () => {
    parsedAs(eq('deployment', 'a'));
    const { onChange, user } = renderField(`"deployment" = 'a'`, `"deployment" = 'b'`);
    expect(await screen.findByDisplayValue('a')).toBeTruthy();

    const settle = deferredRead();
    await user.click(screen.getByRole('button', { name: 'set from outside' }));
    await user.click(addCondition());
    await user.selectOptions(columnSelect(1), 'deployment');
    await user.selectOptions(operatorSelect(1), 'is_empty');
    settle(eq('deployment', 'b'));

    expect(await screen.findByLabelText(/filter-condition-column-1/)).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(`"deployment" = 'a' AND "deployment" IS NULL`);
  });

  test('keeps conditions not yet applied across a look at the SQL', async () => {
    const { user } = renderField();
    await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition }));
    await user.selectOptions(columnSelect(0), 'deployment');

    await user.click(sqlRadio());
    await user.click(builderRadio());

    expect(columnSelect(0)).toHaveValue('deployment');
    expect(screen.getByText(AnalyticsPipelinesI18nKey.FilterSkipped)).toBeTruthy();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });
});

describe('PipelineFilterField — no read source', () => {
  test('keeps a filter in the SQL view until a source is chosen', async () => {
    render(<PipelineFilterField value="a = 1" fields={[]} onChange={vi.fn()} />);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNoSource)).toBeTruthy();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });

  test('waits while the source resolves instead of reporting it missing', async () => {
    render(<PipelineFilterField value="a = 1" isSourcePending fields={[]} onChange={vi.fn()} />);

    expect(await screen.findByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter })).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FilterUnavailableNoSource)).toBeNull();
    // Rows written before the column types arrive would quote every literal as a string.
    expect(builderRadio()).toBeDisabled();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });

  test('withholds the builder when the source columns cannot be read', async () => {
    render(<PipelineFilterField value="a = 1" sourceName="usage" hasFieldsError fields={[]} onChange={vi.fn()} />);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNoSchema)).toBeTruthy();
    expect(builderRadio()).toBeDisabled();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });
});
