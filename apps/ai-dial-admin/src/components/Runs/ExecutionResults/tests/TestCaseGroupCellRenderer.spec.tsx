import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TestCaseGroupCellRenderer from '@/src/components/Runs/ExecutionResults/TestCaseGroupCellRenderer';
import { ExecutionResultRowType } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('TestCaseGroupCellRenderer', () => {
  test('renders an expanded group control and toggles its group', async () => {
    const user = userEvent.setup();
    const onToggleGroup = vi.fn();
    render(
      <TestCaseGroupCellRenderer
        {...({
          value: 'Case 1',
          data: {
            resultRowType: ExecutionResultRowType.Group,
            groupKey: 'case-1',
            isExpanded: true,
          },
          onToggleGroup,
        } as any)}
      />,
    );

    const button = screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.click(button);
    expect(onToggleGroup).toHaveBeenCalledWith('case-1');
  });

  test('renders a child value without an expansion control', () => {
    render(
      <TestCaseGroupCellRenderer
        {...({ value: 'Case 1', data: { resultRowType: ExecutionResultRowType.Result } } as any)}
      />,
    );

    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
