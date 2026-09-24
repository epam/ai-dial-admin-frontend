import { IHeaderParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CompareRunIndexHeader from '../CompareRunIndexHeader';
import { RUN_COMPARE_PRIMARY_INDEX } from '@/src/components/Runs/Compare/constants';

// The renderer reads only runIndex/label/isRightAligned; ag-grid's other header params come from one
// typed fake.
const headerParams = {} as IHeaderParams;

describe('CompareRunIndexHeader alignment', () => {
  test('right-aligns the badge and label when isRightAligned is set', () => {
    const { container } = render(
      <CompareRunIndexHeader {...headerParams} runIndex={RUN_COMPARE_PRIMARY_INDEX} label="HTTP" isRightAligned />,
    );

    expect(container.querySelector('.justify-end')).toBeTruthy();
    expect(screen.getByText('HTTP')).toBeInTheDocument();
  });

  test('does not right-align the badge and label by default', () => {
    const { container } = render(
      <CompareRunIndexHeader {...headerParams} runIndex={RUN_COMPARE_PRIMARY_INDEX} label="HTTP" />,
    );

    expect(container.querySelector('.justify-end')).toBeNull();
  });
});
