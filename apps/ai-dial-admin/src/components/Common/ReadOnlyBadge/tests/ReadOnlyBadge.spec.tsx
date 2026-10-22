import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ReadOnlyBadge from '@/src/components/Common/ReadOnlyBadge/ReadOnlyBadge';
import { ReadOnlyI18nKey } from '@/src/constants/i18n';

describe('ReadOnlyBadge', () => {
  test('renders the read-only label', () => {
    render(<ReadOnlyBadge />);

    expect(screen.getByText(ReadOnlyI18nKey.BadgeLabel)).toBeInTheDocument();
  });
});
