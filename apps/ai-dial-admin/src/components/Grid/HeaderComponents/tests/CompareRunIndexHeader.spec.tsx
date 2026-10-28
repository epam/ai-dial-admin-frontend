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

  test('right-aligns a badge-only header when isRightAligned is set', () => {
    const { container } = render(
      <CompareRunIndexHeader {...headerParams} runIndex={RUN_COMPARE_PRIMARY_INDEX} isRightAligned />,
    );

    expect(container.firstElementChild).toHaveClass('justify-end');
    expect(container.firstElementChild).not.toHaveClass('justify-center');
  });

  test('centers a badge-only header by default', () => {
    const { container } = render(<CompareRunIndexHeader {...headerParams} runIndex={RUN_COMPARE_PRIMARY_INDEX} />);

    expect(container.firstElementChild).toHaveClass('justify-center');
  });

  test('renders the label as small semibold header text', () => {
    render(<CompareRunIndexHeader {...headerParams} runIndex={RUN_COMPARE_PRIMARY_INDEX} label="HTTP" />);

    expect(screen.getByText('HTTP')).toHaveClass('dial-small-semi-text');
  });
});
