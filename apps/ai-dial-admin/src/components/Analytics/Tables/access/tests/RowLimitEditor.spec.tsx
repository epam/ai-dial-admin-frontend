import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import RowLimitEditor from '@/src/components/Analytics/Tables/access/RowLimitEditor';
import { useFilterTree } from '@/src/components/Analytics/QueryBuilder/filter-tree-context';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryOperator,
  QueryValueType,
} from '@/src/models/analytics/query';
import { FilterGroupNode } from '@/src/models/analytics/query-builder';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

// The condition editor is covered in its own specs; here it stands in for "the visual tree", and a button
// fills the first condition the way a user would, then asks the owner to re-render as the real one does.
const treeSpy = vi.hoisted(() => vi.fn());
vi.mock('@/src/components/Analytics/QueryBuilder/Filter/FilterGroup', () => ({
  default: ({ node, fieldOptions }: { node: FilterGroupNode; fieldOptions: { name: string }[] }) => {
    const { refresh, functions } = useFilterTree();
    treeSpy({ fieldOptions, functions });

    return (
      <div>
        <span>{`children: ${node.children.length}`}</span>
        <button
          onClick={() => {
            const condition = node.children[0] as { field: string; value: string };
            condition.field = 'project_id';
            condition.value = 'X-PRJ-1';
            refresh();
          }}
        >
          fill-condition
        </button>
      </div>
    );
  },
}));

const monaco = vi.hoisted(() => ({
  decorations: vi.fn(() => ({ clear: vi.fn() })),
  findMatches: vi.fn(() => [{ range: { startLineNumber: 4 } }]),
}));
vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({
    value,
    onChange,
    onEditorMount,
  }: {
    value?: string;
    onChange: (v?: string) => void;
    onEditorMount?: (editor: unknown) => void;
  }) => {
    onEditorMount?.({
      getModel: () => ({ findMatches: monaco.findMatches }),
      createDecorationsCollection: monaco.decorations,
    });

    return <textarea aria-label="row-limit-json" value={value} onChange={(e) => onChange(e.target.value)} />;
  },
}));

const COLUMNS: AnalyticsTableColumn[] = [
  { source_name: 'p', name: 'project_id', type: AnalyticsFieldType.String },
  { source_name: 'e', name: 'user_email', type: AnalyticsFieldType.String, sensitive: true },
];

const field = (name: string) => ({ type: QueryExprType.Field as const, name });
const value = (v: string) => ({ type: QueryExprType.Value as const, value_type: QueryValueType.String, value: v });
const projectFilter: QueryFilterNode = { op: QueryOperator.Eq, args: [field('project_id'), value('X-PRJ-1')] };
const group = (op: QueryLogicalOperator, ...args: QueryFilterNode[]): QueryFilterNode => ({ op, args });
const tooDeep = group(
  QueryLogicalOperator.And,
  group(QueryLogicalOperator.Or, group(QueryLogicalOperator.And, projectFilter)),
);

const renderEditor = (props: Partial<React.ComponentProps<typeof RowLimitEditor>> = {}) => {
  const onChange = vi.fn();
  const view = render(
    <RowLimitEditor tableName="events" columns={COLUMNS} initialFilter={null} onChange={onChange} {...props} />,
  );

  return { onChange, ...view };
};

const lastValue = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0];

beforeEach(() => vi.clearAllMocks());

describe('RowLimitEditor — visual view', () => {
  test('starts empty in the visual view and reports nothing storable', () => {
    const { onChange } = renderEditor();

    expect(screen.getByText('children: 0')).toBeInTheDocument();
    expect(lastValue(onChange)).toEqual({ filter: null, isComplete: true });
  });

  test('offers the table columns, sensitive ones included, and no function operand', () => {
    renderEditor();

    const { fieldOptions, functions } = treeSpy.mock.lastCall![0];
    expect(fieldOptions.map((option: { name: string }) => option.name)).toEqual(['project_id', 'user_email']);
    expect(functions).toEqual([]);
  });

  test('adds a condition and a group', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));
    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddGroup}` }));

    expect(screen.getByText('children: 2')).toBeInTheDocument();
  });

  test('reports the serialized predicate once a condition is filled', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();

    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));
    await user.click(screen.getByRole('button', { name: 'fill-condition' }));

    expect(lastValue(onChange)).toEqual({
      filter: { op: QueryLogicalOperator.And, args: [projectFilter] },
      isComplete: true,
    });
  });

  test('reports an unfilled condition as nothing storable and incomplete, and says so', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();

    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));

    expect(lastValue(onChange)).toEqual({ filter: null, isComplete: false });
    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.IncompleteConditions);
  });

  test('does not store a wider limit than shown when one condition is filled and another is not', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();

    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));
    await user.click(screen.getByRole('button', { name: 'fill-condition' }));
    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));

    expect(lastValue(onChange)).toMatchObject({ isComplete: false });
    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.IncompleteConditions);
  });

  test('shows no incomplete note once every condition is filled', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: `+ ${AnalyticsTableAccessI18nKey.AddCondition}` }));
    await user.click(screen.getByRole('button', { name: 'fill-condition' }));

    expect(screen.queryByRole('status')).toBeNull();
  });

  test('shows a stored predicate in the visual view and reports it back', () => {
    const { onChange } = renderEditor({ initialFilter: projectFilter });

    expect(screen.getByText('children: 1')).toBeInTheDocument();
    expect(lastValue(onChange)).toEqual({
      filter: { op: QueryLogicalOperator.And, args: [projectFilter] },
      isComplete: true,
    });
  });
});

describe('RowLimitEditor — JSON view', () => {
  test('opens a predicate nested deeper than the visual editor holds as JSON, unchanged, with the reason', () => {
    const { onChange } = renderEditor({ initialFilter: tooDeep });

    expect(screen.getByRole('textbox', { name: 'row-limit-json' })).toHaveValue(JSON.stringify(tooDeep, null, 2));
    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.JsonTooDeep);
    expect(lastValue(onChange)).toEqual({ filter: tooDeep, isComplete: true });
  });

  test('switching to JSON shows the serialized tree', async () => {
    const user = userEvent.setup();
    renderEditor({ initialFilter: projectFilter });

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsJson }));

    expect(screen.getByRole('textbox', { name: 'row-limit-json' })).toHaveValue(
      JSON.stringify({ op: QueryLogicalOperator.And, args: [projectFilter] }, null, 2),
    );
  });

  test('reports an edited valid predicate', async () => {
    const { onChange } = renderEditor({ initialFilter: tooDeep });

    fireEvent.change(screen.getByRole('textbox', { name: 'row-limit-json' }), {
      target: { value: JSON.stringify(projectFilter) },
    });

    expect(lastValue(onChange)).toEqual({ filter: projectFilter, isComplete: true });
  });

  test('reports nothing storable for text that is not a filter', () => {
    const { onChange } = renderEditor({ initialFilter: tooDeep });

    fireEvent.change(screen.getByRole('textbox', { name: 'row-limit-json' }), { target: { value: '{"op":' } });

    expect(lastValue(onChange)).toEqual({ filter: null, isComplete: true });
  });

  test('returns to the visual view for a predicate it can hold', async () => {
    const user = userEvent.setup();
    renderEditor({ initialFilter: tooDeep });
    fireEvent.change(screen.getByRole('textbox', { name: 'row-limit-json' }), {
      target: { value: JSON.stringify(projectFilter) },
    });

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsVisual }));

    expect(screen.getByText('children: 1')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('stays in JSON with the reason for a predicate the visual view cannot hold', async () => {
    const user = userEvent.setup();
    renderEditor({ initialFilter: tooDeep });

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsVisual }));

    expect(screen.getByRole('textbox', { name: 'row-limit-json' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.JsonTooDeep);
  });

  test('stays in JSON with its own message when the text is not a filter at all', async () => {
    const user = userEvent.setup();
    renderEditor({ initialFilter: tooDeep });
    fireEvent.change(screen.getByRole('textbox', { name: 'row-limit-json' }), { target: { value: 'nope' } });

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsVisual }));

    expect(screen.getByRole('textbox', { name: 'row-limit-json' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.RowsJsonInvalid);
  });

  test('marks the lines of the field the service refused', () => {
    renderEditor({ initialFilter: tooDeep, highlightedField: 'project_id' });

    expect(monaco.findMatches).toHaveBeenCalledWith('"name"\\s*:\\s*"project_id"', false, true, false, null, false);
    expect(monaco.decorations).toHaveBeenCalledWith([
      expect.objectContaining({ options: expect.objectContaining({ className: 'row-limit-field-error' }) }),
    ]);
  });

  test('marks nothing when no field is named', () => {
    renderEditor({ initialFilter: tooDeep });

    expect(monaco.findMatches).not.toHaveBeenCalled();
  });
});
