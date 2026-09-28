import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import FieldValue from '../FieldValue';

describe('FieldValue score indicator alignment', () => {
  test('right-aligns the score bar and value when isRightAligned is set', () => {
    const { container } = render(<FieldValue raw="0.8" isScoreIndicator failedLabel="Failed" isRightAligned />);

    expect(screen.getByText('0.800')).toBeInTheDocument();
    expect(container.querySelector('.justify-end')).toBeTruthy();
  });

  test('does not right-align the score bar by default', () => {
    const { container } = render(<FieldValue raw="0.8" isScoreIndicator failedLabel="Failed" />);

    expect(container.querySelector('.justify-end')).toBeNull();
  });
});
