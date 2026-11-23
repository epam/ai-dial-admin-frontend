import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { navigationMock } from '@/test-mocks/navigation';
import Breadcrumbs from '../Breadcrumbs';

const { appsFolder } = vi.hoisted(() => ({
  appsFolder: {
    filePath: '',
    setFilePath: vi.fn(),
    fetchedFoldersData: {} as Record<string, unknown[]>,
    fetchFiles: vi.fn(),
    fetchFolderHierarchy: vi.fn(),
  },
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => appsFolder,
}));

describe('Components - Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMock.setPathname('/models/1');
    navigationMock.setSearchParams('');
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

    expect(navigationMock.router.push).toHaveBeenCalledWith('/models');
  });

  test('Should render breadcrumbs for mobile', () => {
    render(<Breadcrumbs mobile={true} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  describe('Components - Breadcrumbs - folders on the list page', () => {
    test('Should show only the section, leaving the folder path to the list', () => {
      navigationMock.setPathname('/assets-applications');
      appsFolder.filePath = 'public/team/';

      render(<Breadcrumbs mobile={false} />);

      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([MenuI18nKey.Applications]);
    });
  });

  describe('Components - Breadcrumbs - folders on a details page', () => {
    beforeEach(() => {
      navigationMock.setPathname('/assets-applications/MyApp');
      navigationMock.setSearchParams('path=public%2Fteam%2FMyApp__1.0');
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
      navigationMock.setSearchParams('');

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
      expect(navigationMock.router.push).toHaveBeenCalledWith('/assets-applications');
    });

    test('Should load and expand the whole folder chain of the clicked folder', async () => {
      const user = userEvent.setup();
      appsFolder.fetchedFoldersData = { 'public/team/': [] };
      render(<Breadcrumbs mobile={false} />);

      await user.click(screen.getByRole('button', { name: 'team' }));

      expect(appsFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/', true);
    });

    test('Should collapse the middle of a deep trail behind a menu', () => {
      navigationMock.setSearchParams('path=public%2Fteam%2Fsub%2FMyApp__1.0');

      render(<Breadcrumbs mobile={false} />);

      expect(screen.getByRole('button', { name: 'Show hidden path segments' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'public' })).toBeNull();
      expect(screen.getByRole('button', { name: 'sub' })).toBeInTheDocument();
    });
  });
});
