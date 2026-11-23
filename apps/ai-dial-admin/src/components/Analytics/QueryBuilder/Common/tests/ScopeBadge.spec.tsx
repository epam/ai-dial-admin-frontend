import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ScopeBadge from '@/src/components/Analytics/QueryBuilder/Common/ScopeBadge';
import { QueriesI18nKey } from '@/src/constants/i18n';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';

describe('ScopeBadge', () => {
  test.each([
    [SavedQueryScope.Personal, QueriesI18nKey.ScopePersonal],
    [SavedQueryScope.Common, QueriesI18nKey.ScopeCommon],
  ])('labels the %s scope with its translation key', (scope, key) => {
    render(<ScopeBadge scope={scope} />);

    expect(screen.getByText(key)).toBeTruthy();
  });
});
