import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';

describe('SensitiveIndicator', () => {
  test('renders an accessible marker labeled Sensitive', () => {
    render(<SensitiveIndicator />);
    expect(screen.getByRole('img', { name: AnalyticsTablesI18nKey.Sensitive })).toBeInTheDocument();
  });
});
