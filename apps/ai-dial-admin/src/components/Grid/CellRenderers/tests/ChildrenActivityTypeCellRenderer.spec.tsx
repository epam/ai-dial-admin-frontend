import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ChildrenActivityTypeCellRenderer from '../ChildrenActivityTypeCellRenderer';

const params = (data: Record<string, unknown>, shouldIndent?: boolean) =>
  ({ data, shouldIndent }) as unknown as ICellRendererParams;

describe('ChildrenActivityTypeCellRenderer', () => {
  test('indents a child activity', () => {
    render(<ChildrenActivityTypeCellRenderer {...params({ activityType: 'Import', parentActivityId: 'p1' })} />);

    expect(screen.getByText('Import').parentElement).toHaveClass('pl-6');
  });

  test('does not indent a parent activity', () => {
    render(<ChildrenActivityTypeCellRenderer {...params({ activityType: 'Import' })} />);

    expect(screen.getByText('Import').parentElement).not.toHaveClass('pl-6');
  });

  test('does not indent a child when shouldIndent is false', () => {
    render(<ChildrenActivityTypeCellRenderer {...params({ activityType: 'Import', parentActivityId: 'p1' }, false)} />);

    expect(screen.getByText('Import').parentElement).not.toHaveClass('pl-6');
  });
});
