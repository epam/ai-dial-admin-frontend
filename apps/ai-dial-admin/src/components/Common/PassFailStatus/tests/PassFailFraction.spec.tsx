import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';

describe('PassFailFraction', () => {
  test('renders passed over total', () => {
    render(<PassFailFraction counts={{ passed: 3, failed: 0, error: 0, total: 7 }} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/ 7')).toBeInTheDocument();
  });
});
