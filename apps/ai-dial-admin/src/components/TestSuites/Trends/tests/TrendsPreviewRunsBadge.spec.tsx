import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import TrendsPreviewRunsBadge from '@/src/components/TestSuites/Trends/TrendsPreviewRunsBadge';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

describe('TrendsPreviewRunsBadge', () => {
  test('shows preview runs label and last-N badge', () => {
    render(<TrendsPreviewRunsBadge runCount={10} />);

    expect(screen.getByText(`${TestSuitesI18nKey.TrendsPreviewRuns}:`)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsPreviewRunsLastN)).toBeInTheDocument();
  });
});
