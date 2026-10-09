import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { BasicI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { MenuGroupConfiguration } from '../../menu-configuration';
import MenuItem from '../MenuItem';

const PREVIEW_LABEL = BasicI18nKey.Preview; // mocked t() returns the key as-is

const analyticsGroup = (overrides: Partial<MenuGroupConfiguration> = {}): MenuGroupConfiguration => ({
  key: MenuI18nKey.Analytics,
  descriptionKey: MenuI18nKey.Analytics,
  isPreview: true,
  items: [{ key: MenuI18nKey.Queries, href: ApplicationRoute.AnalyticsQueries }],
  ...overrides,
});

describe('MenuItem — Preview tag on group header', () => {
  test('renders the Preview tag when the group is preview and the sidebar is expanded', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.getByText(PREVIEW_LABEL)).toBeInTheDocument();
  });

  test('does not render the Preview tag when the sidebar is collapsed', () => {
    render(<MenuItem config={analyticsGroup()} activeMenuItem="" isSidebarOpen={false} />);

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
  });

  test('does not render the Preview tag for a non-preview group', () => {
    render(<MenuItem config={analyticsGroup({ isPreview: false })} activeMenuItem="" isSidebarOpen={true} />);

    expect(screen.queryByText(PREVIEW_LABEL)).not.toBeInTheDocument();
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
