import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { createSkill, createSkillFolder } from '@/src/app/[lang]/skills/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/skills/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/skills/actions')>()),
  createSkill: vi.fn().mockResolvedValue({ success: true }),
  createSkillFolder: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <button onClick={() => props.onCreateFolder(undefined, 'public/new-folder')}>create-folder</button>
  ),
}));

vi.mock('../Modals', () => ({
  __esModule: true,
  default: (props: any) => (
    <button onClick={() => props.onCreate({ name: 'my-skill', description: 'Does a thing' })}>create-skill</button>
  ),
}));

/**
 * Folder-create and skill-create are two different Core operations for this type (design D2), so
 * `BaseAssetList` calls them directly rather than through the shared `CreateAssetActionMap` every
 * other asset type uses. This asserts that branch, not the generic map-driven path other types cover.
 */
describe('BaseAssetList :: AssetsSkills create branches', () => {
  test('Create > Folder calls createSkillFolder with no trailing slash, not CreateAssetActionMap', async () => {
    render(<BaseAssetList view={ApplicationRoute.Skills} />);

    fireEvent.click(screen.getByText('create-folder'));

    // `createSkillFolder` (the Core API method behind this action) appends its own trailing slash to
    // build the grouping-folder route — passing a path that already ends in one produced a `//` Core
    // rejected as not found.
    await vi.waitFor(() => expect(createSkillFolder).toHaveBeenCalledWith('public/new-folder'));
  });

  test('Create > Skill calls createSkill with name, description, and the current root folder', async () => {
    render(<BaseAssetList view={ApplicationRoute.Skills} />);

    fireEvent.click(screen.getByText('create-skill'));

    await vi.waitFor(() => expect(createSkill).toHaveBeenCalledWith('my-skill', 'Does a thing', 'public/'));
  });
});
