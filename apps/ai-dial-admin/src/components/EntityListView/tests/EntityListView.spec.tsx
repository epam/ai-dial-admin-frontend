import { useRouter } from 'next/navigation';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import * as openInNewTabUtils from '@/src/utils/open-in-new-tab';

let capturedOpen: ((entity?: unknown) => void) | undefined;
let capturedGetHref: ((data: unknown) => string | undefined) | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { getHref?: (data: unknown) => string | undefined }) => {
    capturedGetHref = props.getHref;
    return null;
  },
}));

vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  ENTITIES_COLUMNS: (columns: unknown[], _remove: unknown, _duplicate: unknown, open?: (entity?: unknown) => void) => {
    capturedOpen = open;
    return columns;
  },
}));

vi.mock('@/src/components/EntityListView/Components/Actions', () => ({
  default: () => null,
}));

vi.mock('@/src/components/EntityListView/HeaderButtons/HeaderButtons', () => ({
  default: () => null,
}));

describe('BaseEntityList — open in new tab', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    capturedOpen = undefined;
    capturedGetHref = undefined;
  });

  const renderList = () =>
    render(
      <BaseEntityList
        data={[{ name: 'my-model' }]}
        baseColumns={[]}
        route={ApplicationRoute.Models}
        onRemoveEntity={vi.fn()}
      />,
    );

  test('opens the config-file query param when the row is config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList();

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' });
  });

  test('opens the bare route when the row is not config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList();

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' });
  });
});

describe('BaseEntityList — rendered row hrefs', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    capturedOpen = undefined;
    capturedGetHref = undefined;
  });

  const renderList = (route: ApplicationRoute) =>
    render(
      <BaseEntityList
        data={[{ name: 'my-model' }]}
        baseColumns={[]}
        route={route}
        onRemoveEntity={vi.fn()}
      />,
    );

  test('renders a config-file dual-bucket href with the flag and no path param', () => {
    renderList(ApplicationRoute.AssetsApplications);

    const href = capturedGetHref?.({ name: 'my-app' });

    expect(href).toBe('/assets-applications/my-app');
    expect(href).not.toContain('path=');
  });

  test('renders a config-file toolset href with the flag and no path param', () => {
    renderList(ApplicationRoute.AssetsToolsets);

    expect(capturedGetHref?.({ name: 'my-toolset' })).toBe('/assets-toolsets/my-toolset');
  });

  test('renders the bare href when the row is not config-file-sourced', () => {
    renderList(ApplicationRoute.Models);

    expect(capturedGetHref?.({ name: 'my-model' })).toBe('/models/my-model');
  });
});
