import { useRouter } from 'next/navigation';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import * as openInNewTabUtils from '@/src/utils/open-in-new-tab';

let capturedOpen: ((entity?: unknown) => void) | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => null,
}));

vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  ENTITIES_COLUMNS: (
    columns: unknown[],
    _remove: unknown,
    _duplicate: unknown,
    open?: (entity?: unknown) => void,
  ) => {
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
  });

  const renderList = (isConfigFileSource?: boolean) =>
    render(
      <BaseEntityList
        data={[{ name: 'my-model' }]}
        baseColumns={[]}
        route={ApplicationRoute.Models}
        onRemoveEntity={vi.fn()}
        isConfigFileSource={isConfigFileSource}
      />,
    );

  test('opens the config-file query param when the row is config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList(true);

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' }, '?configFile=true');
  });

  test('opens the bare route when the row is not config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList(false);

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' }, undefined);
  });
});
