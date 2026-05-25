import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import GroupSection from '@/src/components/Runs/Export/components/GroupSection';
import { ColumnGroup } from '@/src/components/Runs/Export/models';
import { ColumnGroupId, groupColumns } from '@/src/components/Runs/Export/utils/group-columns';
import { ExportRunI18nKey } from '@/src/constants/i18n';

function makeGroup(columnNames: string[], id: ColumnGroupId): ColumnGroup {
  return groupColumns(columnNames).find((g) => g.id === id)!;
}

describe('GroupSection', () => {
  it('renders the group header label', () => {
    const group = makeGroup(['id'], ColumnGroupId.Identification);
    render(
      <GroupSection group={group} checkedColumns={new Set(['id'])} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />,
    );
    expect(screen.getByText(ExportRunI18nKey.GroupIdentification)).toBeInTheDocument();
  });

  it('shows leaf columns when expanded', () => {
    const group = makeGroup(['data:prompt', 'data:systemPrompt'], ColumnGroupId.Data);
    render(<GroupSection group={group} checkedColumns={new Set()} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />);
    expect(screen.getByText('prompt')).toBeInTheDocument();
    expect(screen.getByText('systemPrompt')).toBeInTheDocument();
  });

  it('hides columns when collapsed', async () => {
    const group = makeGroup(['data:prompt'], ColumnGroupId.Data);
    render(<GroupSection group={group} checkedColumns={new Set()} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('prompt')).not.toBeInTheDocument();
  });

  it('calls onToggleGroup when header checkbox is clicked', async () => {
    const onToggleGroup = vi.fn();
    const group = makeGroup(['id'], ColumnGroupId.Identification);
    render(
      <GroupSection
        group={group}
        checkedColumns={new Set(['id'])}
        onToggleColumn={vi.fn()}
        onToggleGroup={onToggleGroup}
      />,
    );
    await userEvent.click(screen.getByLabelText(ExportRunI18nKey.GroupIdentification));
    expect(onToggleGroup).toHaveBeenCalledWith(ColumnGroupId.Identification, expect.any(Boolean));
  });

  it('renders metric sub-sections for the Metrics group', () => {
    const group = makeGroup(['metric:Accuracy:score', 'metric:Recall:score'], ColumnGroupId.Metrics);
    render(<GroupSection group={group} checkedColumns={new Set()} onToggleColumn={vi.fn()} onToggleGroup={vi.fn()} />);
    expect(screen.getByText('metric:Accuracy')).toBeInTheDocument();
    expect(screen.getByText('metric:Recall')).toBeInTheDocument();
  });
});
