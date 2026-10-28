import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as actions from '@/src/app/[lang]/assets-toolsets/actions';
import ToolsetView from '@/src/components/Assets/Entities/Toolsets/View/View';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import * as folderContext from '@/src/context/assets/ToolsetsFolderContext';
import { AssetToolset } from '@/src/models/dial/deployment-asset';

const toolset = {
  name: 'assistant',
  folderId: 'public/team/',
  path: 'public/team/assistant__stable',
  version: 'stable',
  display_version: 'Spring release',
  _metadata: { name: 'assistant', path: 'public/team/assistant__stable', folderId: 'public/team/', version: 'stable' },
} as AssetToolset;

const renderView = () => render(<ToolsetView etag="current-etag" originalToolset={toolset} />);

describe('ToolsetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), refresh: vi.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.spyOn(folderContext, 'useToolsetFolder').mockReturnValue({ fetchFiles: vi.fn() } as unknown as ReturnType<
      typeof folderContext.useToolsetFolder
    >);
    vi.spyOn(actions, 'updateToolset').mockResolvedValue({ success: true });
    vi.spyOn(actions, 'moveToolsets').mockResolvedValue([{ success: true }]);
  });

  test('shows read-only Version and no sibling selector', () => {
    renderView();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /version/i })).toBeNull();
    expect(screen.getByRole('textbox', { name: /EntityFields.displayVersion/ })).toHaveValue('Spring release');
  });

  test('freezes forged JSON identity and preserves independent display version on save', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'JSON editor' }), {
      target: {
        value: JSON.stringify({
          ...toolset,
          path: 'public/forged__forged',
          version: 'forged',
          display_version: '',
          _metadata: { ...toolset._metadata, path: 'public/forged__forged', version: 'forged' },
        }),
      },
    });
    expect(screen.queryByText('stable')).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.SaveAsNewVersion })).toBeNull();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await vi.waitFor(() =>
      expect(actions.updateToolset).toHaveBeenCalledWith(
        expect.objectContaining({
          path: toolset.path,
          version: 'stable',
          _metadata: toolset._metadata,
          display_version: '',
        }),
        'current-etag',
      ),
    );
  });

  test('retries a rejected update with the latest response etag', async () => {
    const user = userEvent.setup();
    vi.mocked(actions.updateToolset).mockResolvedValueOnce({
      success: false,
      etag: 'latest-etag',
      errorMessage: 'Rejected',
    });
    renderView();
    await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'JSON editor' }), {
      target: { value: JSON.stringify({ ...toolset, display_version: 'Summer release' }) },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await vi.waitFor(() =>
      expect(actions.updateToolset).toHaveBeenLastCalledWith(
        expect.objectContaining({ display_version: 'Summer release' }),
        'latest-etag',
      ),
    );
  });

  test('moves only the opened complete path with the original suffix', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'JSON editor' }), {
      target: { value: JSON.stringify({ ...toolset, folderId: 'public/new/' }) },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await vi.waitFor(() =>
      expect(actions.moveToolsets).toHaveBeenCalledExactlyOnceWith(['public/team/assistant__stable'], 'public/new'),
    );
  });
});
