import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import RowsRestrictedBadge from '@/src/components/Analytics/Tables/RowsRestrictedBadge';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';

describe('RowsRestrictedBadge', () => {
  test('states that rows are restricted', () => {
    render(<RowsRestrictedBadge />);

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeInTheDocument();
  });

  test('never shows the limit itself', () => {
    render(<RowsRestrictedBadge hasTooltip />);

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeInTheDocument();
    expect(screen.queryByText(/project_id/)).toBeNull();
  });
});
