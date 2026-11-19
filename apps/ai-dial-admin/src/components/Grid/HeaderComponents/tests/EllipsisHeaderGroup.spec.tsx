import { IHeaderGroupParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EllipsisHeaderGroup from '../EllipsisHeaderGroup';

// The renderer reads only displayName; ag-grid's other header group params come from one typed fake.
const headerGroupParams = {} as IHeaderGroupParams;

describe('EllipsisHeaderGroup', () => {
  test('renders the group label truncated so a long label cannot widen the group', () => {
    render(<EllipsisHeaderGroup {...headerGroupParams} displayName="Context Precision" />);

    expect(screen.getByText('Context Precision')).toHaveClass('truncate');
  });

  test('keeps the label at the start by default', () => {
    render(<EllipsisHeaderGroup {...headerGroupParams} displayName="Context Precision" />);

    expect(screen.getByText('Context Precision').closest('.text-end')).toBeNull();
  });

  test('pushes the label to the end when right aligned', () => {
    render(<EllipsisHeaderGroup {...headerGroupParams} displayName="score" isRightAligned />);

    expect(screen.getByText('score').closest('.text-end')).not.toBeNull();
  });
});
