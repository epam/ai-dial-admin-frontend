import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import RestrictedBadge from '@/src/components/Analytics/Tables/RestrictedBadge';
import { RestrictionKind } from '@/src/components/Analytics/Tables/models';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';

describe('RestrictedBadge', () => {
  test('states that rows are restricted', () => {
    render(<RestrictedBadge kind={RestrictionKind.Rows} />);

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ColumnsRestricted)).toBeNull();
  });

  test('states that columns are restricted', () => {
    render(<RestrictedBadge kind={RestrictionKind.Columns} />);

    expect(screen.getByText(AnalyticsTableAccessI18nKey.ColumnsRestricted)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeNull();
  });

  test('never shows the limit itself', () => {
    render(<RestrictedBadge kind={RestrictionKind.Rows} hasTooltip />);

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeInTheDocument();
    expect(screen.queryByText(/project_id/)).toBeNull();
  });
});
