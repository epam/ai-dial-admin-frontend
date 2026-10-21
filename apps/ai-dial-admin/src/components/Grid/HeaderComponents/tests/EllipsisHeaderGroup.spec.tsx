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
});
