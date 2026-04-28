import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import WarningIcon from '@/src/components/Common/WarningIcon/WarningIcon';

describe('WarningIcon', () => {
  test('renders icon visible when warningText is a non-empty string', () => {
    const { container } = render(<WarningIcon warningText="something is wrong" />);
    const icon = container.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('class') ?? '').toContain('text-warning-icon');
    expect(icon?.getAttribute('class') ?? '').not.toContain('hidden');
  });

  test('hides icon when warningText is undefined', () => {
    const { container } = render(<WarningIcon warningText={undefined} />);
    const icon = container.querySelector('svg');
    expect(icon?.getAttribute('class') ?? '').toContain('hidden');
  });

  test('hides icon when warningText is an empty string', () => {
    const { container } = render(<WarningIcon warningText="" />);
    const icon = container.querySelector('svg');
    expect(icon?.getAttribute('class') ?? '').toContain('hidden');
  });

  test('renders nothing missing when no prop is passed', () => {
    const { container } = render(<WarningIcon />);
    const icon = container.querySelector('svg');
    expect(icon?.getAttribute('class') ?? '').toContain('hidden');
  });
});
