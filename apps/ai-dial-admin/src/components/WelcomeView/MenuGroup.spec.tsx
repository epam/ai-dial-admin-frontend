import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import MenuGroup from './MenuGroup';

const catalogGroup: MenuGroupConfiguration = {
  key: MenuI18nKey.Catalog,
  descriptionKey: MenuI18nKey.CatalogDescription,
  items: [
    { key: MenuI18nKey.PlatformModels, href: ApplicationRoute.PlatformModels },
    { key: MenuI18nKey.PlatformInterceptors, href: ApplicationRoute.PlatformInterceptors },
    { key: MenuI18nKey.PlatformTranslators, href: ApplicationRoute.PlatformTranslators },
    { key: MenuI18nKey.PlatformRoutes, href: ApplicationRoute.PlatformRoutes },
    { key: MenuI18nKey.PlatformAppRunners, href: ApplicationRoute.PlatformAppRunners },
    { key: MenuI18nKey.PlatformRoles, href: ApplicationRoute.PlatformRoles },
    { key: MenuI18nKey.PlatformKeys, href: ApplicationRoute.PlatformKeys },
  ],
};

describe('MenuGroup', () => {
  test('renders every catalog item as a link and grows with the list instead of clipping it', () => {
    const { container } = render(<MenuGroup menuGroup={catalogGroup} />);

    catalogGroup.items.forEach((item) => {
      expect(screen.getByRole('link', { name: item.key })).toHaveAttribute('href', item.href);
    });

    expect(container.firstChild).toHaveClass('min-h-[324px]', 'overflow-hidden');
    expect(container.firstChild).not.toHaveClass('h-[324px]');
    expect(screen.getByRole('list')).toHaveClass('overflow-y-auto', 'min-h-0');
  });
});
