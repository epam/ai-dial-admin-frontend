import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { BasicI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { MenuGroupConfiguration } from '../../menu-configuration';
import MenuItem from '../MenuItem';

const PREVIEW_LABEL = BasicI18nKey.Preview; // mocked t() returns the key as-is

const analyticsGroup = (overrides: Partial<MenuGroupConfiguration> = {}): MenuGroupConfiguration => ({
  key: MenuI18nKey.AnalyticsV2,
  descriptionKey: MenuI18nKey.AnalyticsV2,
  isPreview: true,
  items: [{ key: MenuI18nKey.QueryBuilder, href: ApplicationRoute.AnalyticsV2QueryBuilder }],
  ...overrides,
});

describe('MenuItem — Preview tag on group header', () => {
  test('renders the Preview tag when the group is preview and the sidebar is expanded', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isOpenByDefault={false} isSidebarOpen={true} />);

    expect(screen.getByText(PREVIEW_LABEL)).toBeInTheDocument();
  });

  test('does not render the Preview tag when the sidebar is collapsed', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isOpenByDefault={false} isSidebarOpen={false} />);

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
  });

  test('does not render the Preview tag for a non-preview group', () => {
    render(
      <MenuItem
        config={analyticsGroup({ isPreview: false })}
        activeMenuItem=""
        isOpenByDefault={false}
        isSidebarOpen={true}
      />,
    );

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
  });
});
