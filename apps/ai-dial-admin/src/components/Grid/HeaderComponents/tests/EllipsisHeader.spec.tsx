import { IHeaderParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EllipsisHeader from '../EllipsisHeader';

// The renderer reads only displayName/isRightAligned; ag-grid's other header params come from one
// typed fake.
const headerParams = {} as IHeaderParams;

describe('EllipsisHeader alignment', () => {
  test('right-aligns the label when isRightAligned is set', () => {
    render(<EllipsisHeader {...headerParams} displayName="# Run number" isRightAligned />);

    expect(screen.getByText('# Run number')).toHaveClass('text-right');
  });

  test('does not right-align the label by default', () => {
    render(<EllipsisHeader {...headerParams} displayName="# Run number" />);

    expect(screen.getByText('# Run number')).not.toHaveClass('text-right');
  });
});
