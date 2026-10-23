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
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check that the chevron is rendered between breadcrumbs
    const allText = screen.getByText(MenuI18nKey.Models).parentElement?.parentElement?.textContent;
    expect(allText).toContain(MenuI18nKey.Models);
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
      navigation.search = 'path=public%2Fteam%2Fsub%2FMyApp__1.0';
    });

    test('Should show the entity folders between the section and the entity', () => {
      render(<Breadcrumbs mobile={false} />);

      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        MenuI18nKey.Applications,
        'public',
        'team',
        'sub',
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

      await user.click(screen.getByRole('link', { name: 'team' }));

      expect(appsFolder.setFilePath).toHaveBeenCalledWith('public/team/');
      expect(navigation.router.push).toHaveBeenCalledWith('/assets-applications');
    });

    test('Should load and expand the whole folder chain of the clicked folder', async () => {
      const user = userEvent.setup();
      appsFolder.fetchedFoldersData = { 'public/team/': [] };
      render(<Breadcrumbs mobile={false} />);

      await user.click(screen.getByRole('link', { name: 'team' }));

      expect(appsFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/', true);
    });

    test('Should load the ancestors of a nested folder the shared context does not hold yet', async () => {
      const user = userEvent.setup();
      render(<Breadcrumbs mobile={false} />);

      await user.click(screen.getByRole('link', { name: 'sub' }));

      expect(appsFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/sub/', true);
      expect(navigation.router.push).toHaveBeenCalledWith('/assets-applications');
    });
  });
});
