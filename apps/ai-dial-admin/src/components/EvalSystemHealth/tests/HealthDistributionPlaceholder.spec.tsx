import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import HealthDistributionPlaceholder from '@/src/components/EvalSystemHealth/HealthDistributionPlaceholder';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

describe('HealthDistributionPlaceholder', () => {
  test('shows the chart title', () => {
    render(<HealthDistributionPlaceholder />);

    expect(screen.getByRole('heading', { name: EvalSystemHealthI18nKey.HealthDistribution })).toBeTruthy();
  });

  test('hides the skeleton from assistive technology so it announces no content', () => {
    const { container } = render(<HealthDistributionPlaceholder />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
