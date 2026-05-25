import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Columns from '@/src/components/Runs/Export/components/Columns';
import { ColumnGroup } from '@/src/components/Runs/Export/models';
import { ColumnGroupId, groupColumns } from '@/src/components/Runs/Export/utils/group-columns';
import { ExportRunI18nKey } from '@/src/constants/i18n';

function makeGroups(columnNames: string[]): ColumnGroup[] {
  return groupColumns(columnNames);
}

describe('Columns', () => {
  it('renders group labels', () => {
    const groups = makeGroups(['id', 'data:prompt']);
    const checkedColumns = new Set(['id', 'data:prompt']);

    render(
      <Columns groups={groups} checkedColumns={checkedColumns} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />,
    );

    expect(screen.getByText(ExportRunI18nKey.GroupIdentification)).toBeInTheDocument();
    expect(screen.getByText(ExportRunI18nKey.GroupData)).toBeInTheDocument();
  });

  it('calls onToggleColumn when a column checkbox is clicked', async () => {
    const groups = makeGroups(['id']);
    const checkedColumns = new Set(['id']);
    const onToggleColumn = vi.fn();

    render(
      <Columns
        groups={groups}
        checkedColumns={checkedColumns}
        onToggleColumn={onToggleColumn}
        onToggleGroup={vi.fn()}
      />,
    );

    const checkbox = screen.getByLabelText('id');
    await userEvent.click(checkbox);
    expect(onToggleColumn).toHaveBeenCalledWith('id', expect.any(Boolean));
  });

  it('calls onToggleGroup when a group header checkbox is clicked', async () => {
    const groups = makeGroups(['id', 'testCaseId']);
    const checkedColumns = new Set(['id', 'testCaseId']);
    const onToggleGroup = vi.fn();

    render(
      <Columns
        groups={groups}
        checkedColumns={checkedColumns}
        onToggleColumn={vi.fn()}
        onToggleGroup={onToggleGroup}
      />,
    );

    const groupCheckbox = screen.getByLabelText(ExportRunI18nKey.GroupIdentification);
    await userEvent.click(groupCheckbox);
    expect(onToggleGroup).toHaveBeenCalledWith(ColumnGroupId.Identification, expect.any(Boolean));
  });

  it('renders columns in a 4-column grid', () => {
    const columns = ['id', 'testSuiteId', 'testCaseId', 'runIndex', 'computationId'];
    const groups = makeGroups(columns);
    const checkedColumns = new Set(columns);

    const { container } = render(
      <Columns groups={groups} checkedColumns={checkedColumns} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />,
    );

    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('renders metric sub-group headers', () => {
    const groups = makeGroups(['metric:Accuracy:score', 'metric:Recall:score']);
    const checkedColumns = new Set(['metric:Accuracy:score', 'metric:Recall:score']);

    render(
      <Columns groups={groups} checkedColumns={checkedColumns} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />,
    );

    expect(screen.getByText('metric:Accuracy')).toBeInTheDocument();
    expect(screen.getByText('metric:Recall')).toBeInTheDocument();
  });

  it('shows a loader when isLoading is true', () => {
    const { container } = render(
      <Columns
        groups={[]}
        checkedColumns={new Set()}
        isLoading={true}
        onToggleColumn={vi.fn()}
        onToggleGroup={vi.fn()}
      />,
    );

    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });
});
