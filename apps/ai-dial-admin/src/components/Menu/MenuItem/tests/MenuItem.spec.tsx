import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { BasicI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { MenuBadge, MenuGroupConfiguration } from '../../menu-configuration';
import MenuItem from '../MenuItem';

// mocked t() returns the key as-is
const PREVIEW_LABEL = BasicI18nKey.Preview;
const DEPRECATED_LABEL = BasicI18nKey.Deprecated;

const analyticsGroup = (overrides: Partial<MenuGroupConfiguration> = {}): MenuGroupConfiguration => ({
  key: MenuI18nKey.Analytics,
  descriptionKey: MenuI18nKey.Analytics,
  badge: MenuBadge.Preview,
  items: [{ key: MenuI18nKey.Queries, href: ApplicationRoute.AnalyticsQueries }],
  ...overrides,
});

describe('MenuItem — badge on group header', () => {
  test('renders the Preview badge when the group is Preview and the sidebar is expanded', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.getByText(PREVIEW_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(DEPRECATED_LABEL)).not.toBeInTheDocument();
  });

  test('renders the Deprecated badge when the group is Deprecated and the sidebar is expanded', () => {
    render(
      <MenuItem config={analyticsGroup({ badge: MenuBadge.Deprecated })} activeMenuItem="" isSidebarOpen={true} />,
    );

    expect(screen.getByText(DEPRECATED_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
  });

  test('does not render a badge when the sidebar is collapsed', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={false} />);

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
  });

  test('does not render a badge for a group without one', () => {
    render(<MenuItem config={analyticsGroup({ badge: undefined })} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByText(DEPRECATED_LABEL)).not.toBeInTheDocument();
  });

  test('renders a badge on a sub-item that declares one', () => {
    const config = analyticsGroup({
      badge: undefined,
      items: [{ key: MenuI18nKey.Queries, href: ApplicationRoute.AnalyticsQueries, badge: MenuBadge.Deprecated }],
    });
    render(<MenuItem config={config} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.getByText(DEPRECATED_LABEL)).toBeInTheDocument();
  });
});

describe('MenuItem � static group', () => {
  test('renders the sub-items without any toggle and keeps the header non-interactive', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.getByRole('link', { name: MenuI18nKey.Queries })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(MenuI18nKey.Analytics)).toBeInTheDocument();
  });

  test('renders an icon for the sub-item and marks the active one as the current page', () => {
    render(
      <MenuItem config={analyticsGroup()} activeMenuItem={ApplicationRoute.AnalyticsQueries} isSidebarOpen={true} />,
    );

    const link = screen.getByRole('link', { name: MenuI18nKey.Queries });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.querySelector('svg')).toBeInTheDocument();
  });

  test('exposes the group name as the list label and draws a separator when collapsed', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={false} hasDivider />);

    expect(screen.getByRole('list', { name: MenuI18nKey.Analytics })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  test('draws no separator for the first group', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={false} />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
