import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EmptyCellRenderer from '../EmptyCellRenderer';

describe('EmptyCellRenderer', () => {
  test('should render nothing', () => {
    const { container } = render(<EmptyCellRenderer />);

    expect(container.firstChild).toBeNull();
  });
});
