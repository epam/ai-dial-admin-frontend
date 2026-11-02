import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import Breadcrumbs from '../Breadcrumbs';

// The router is one shared object, like the real one: `Breadcrumbs` lists it as an effect dependency, so
// a new object per render would re-run that effect on every render.
const { navigation, appsFolder } = vi.hoisted(() => ({
  navigation: { pathname: '/models/1', search: '', router: { push: vi.fn() } },
  appsFolder: {
    filePath: '',
    setFilePath: vi.fn(),
    fetchedFoldersData: {} as Record<string, unknown[]>,
    fetchFiles: vi.fn(),
    fetchFolderHierarchy: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => appsFolder,
}));

describe('Components - Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.pathname = '/models/1';
    navigation.search = '';
    appsFolder.filePath = '';
    appsFolder.fetchedFoldersData = {};
  });

  test('Should render breadcrumbs for desktop', () => {
    render(<Breadcrumbs mobile={false} />);
    expect(screen.getByRole('link', { name: MenuI18nKey.Models })).toBeInTheDocument();
    expect(screen.getByText('1').closest('[aria-current="page"]')).toBeTruthy();
  });

  test('Should open a section crumb through the router', async () => {
    const user = userEvent.setup();
    render(<Breadcrumbs mobile={false} />);

    await user.click(screen.getByRole('link', { name: MenuI18nKey.Models }));

    expect(navigation.router.push).toHaveBeenCalledWith('/models');
  });

  test('Should render breadcrumbs for mobile', () => {
    render(<Breadcrumbs mobile={true} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  describe('Components - Breadcrumbs - folders on the list page', () => {
    test('Should show the selected folder after the section', () => {
      navigation.pathname = '/assets-applications';
      appsFolder.filePath = 'public/team/';

      render(<Breadcrumbs mobile={false} />);

      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        MenuI18nKey.Applications,
        'public',
        'team',
      ]);
    });
  });

  describe('Components - Breadcrumbs - folders on a details page', () => {
    beforeEach(() => {
      navigation.pathname = '/assets-applications/MyApp';
      navigation.search = 'path=public%2Fteam%2FMyApp__1.0';
    });

    test('Should show the entity folders between the section and the entity', () => {
      render(<Breadcrumbs mobile={false} />);

      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        MenuI18nKey.Applications,
        'public',
        'team',
        'MyApp',
      ]);
    });

    test('Should show only the section and the entity when the entity has no folder', () => {
      navigation.search = '';

      render(<Breadcrumbs mobile={false} />);

      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        MenuI18nKey.Applications,
        'MyApp',
      ]);
    });

    test('Should select the clicked folder and go back to the list', async () => {
      const user = userEvent.setup();
      render(<Breadcrumbs mobile={false} />);

      await user.click(screen.getByRole('button', { name: 'team' }));

      expect(appsFolder.setFilePath).toHaveBeenCalledWith('public/team/');
      expect(navigation.router.push).toHaveBeenCalledWith('/assets-applications');
    });

    test('Should load and expand the whole folder chain of the clicked folder', async () => {
      const user = userEvent.setup();
      appsFolder.fetchedFoldersData = { 'public/team/': [] };
      render(<Breadcrumbs mobile={false} />);

      await user.click(screen.getByRole('button', { name: 'team' }));

      expect(appsFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/', true);
    });

    test('Should collapse the middle of a deep trail behind a menu', () => {
      navigation.search = 'path=public%2Fteam%2Fsub%2FMyApp__1.0';

      render(<Breadcrumbs mobile={false} />);

      expect(screen.getByRole('button', { name: 'Show hidden path segments' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'public' })).toBeNull();
      expect(screen.getByRole('button', { name: 'sub' })).toBeInTheDocument();
    });
  });
});
