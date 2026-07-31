import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import BlankCellRenderer from '../BlankCellRenderer';

describe('BlankCellRenderer', () => {
  test('should render nothing', () => {
    const { container } = render(<BlankCellRenderer />);

    expect(container.firstChild).toBeNull();
  });
});
