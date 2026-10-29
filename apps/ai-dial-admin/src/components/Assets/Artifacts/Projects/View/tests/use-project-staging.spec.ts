import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { removeProjectFile, uploadProjectFile } from '@/src/app/[lang]/projects/actions';
import { DialProjectFile } from '@/src/models/dial/resource';
import { useProjectStaging } from '../use-project-staging';

vi.mock('@/src/app/[lang]/projects/actions', () => ({
  uploadProjectFile: vi.fn(),
  removeProjectFile: vi.fn(),
}));

const MANIFEST = '---\nname: p\ndescription: Original\nowner: team-a\n---\n\nBe helpful.';
const FILES: DialProjectFile[] = [{ name: 'PROJECT.md' }, { name: 'context/a.csv', size: 10 }, { name: 'notes/x.txt' }];

type Params = Parameters<typeof useProjectStaging>[0];

const setup = (params?: Partial<Params>) =>
  renderHook((props: Params) => useProjectStaging(props), {
    initialProps: { manifestContent: MANIFEST, projectName: 'p', files: FILES, ...params },
  });

describe('useProjectStaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadProjectFile).mockResolvedValue({ success: true });
    vi.mocked(removeProjectFile).mockResolvedValue({ success: true });
  });

  describe('loading', () => {
    test('is loaded as soon as a manifest is given, even an empty one', () => {
      expect(setup().result.current.isLoaded).toBe(true);
      expect(setup({ manifestContent: '' }).result.current.isLoaded).toBe(true);
    });

    test('is not loaded while the manifest is still being read', () => {
      const { result } = setup({ manifestContent: undefined });

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.description).toBe('');
    });

    test('becomes loaded and shows the manifest fields once it arrives, without looking changed', () => {
      const { result, rerender } = setup({ manifestContent: undefined });

      rerender({ manifestContent: MANIFEST, projectName: 'p', files: FILES });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.description).toBe('Original');
      expect(result.current.instructions).toBe('Be helpful.');
      expect(result.current.isChanged).toBe(false);
    });
  });

  describe('fields and files', () => {
    test('reads the description and instructions from the manifest', () => {
      const { result } = setup();

      expect(result.current.description).toBe('Original');
      expect(result.current.instructions).toBe('Be helpful.');
    });

    test('lists only context files, without the manifest or files elsewhere', () => {
      expect(setup().result.current.storedFiles).toEqual([{ name: 'a.csv', size: 10 }]);
    });

    test('is changed once a field is edited, and not when it is edited back to the original', () => {
      const { result } = setup();

      act(() => result.current.onChangeDescription('New'));
      expect(result.current.isChanged).toBe(true);
      act(() => result.current.onChangeDescription('Original'));
      expect(result.current.isChanged).toBe(false);
    });

    test('stages added files, and the removal of a stored file once', () => {
      const { result } = setup();

      act(() => result.current.onAddFiles([new File(['x'], 'new.csv')]));
      act(() => result.current.onRemoveStoredFile('a.csv'));
      act(() => result.current.onRemoveStoredFile('a.csv'));

      expect(result.current.addedFiles.map((file) => file.name)).toEqual(['new.csv']);
      expect(result.current.removedFileNames).toEqual(['a.csv']);
      expect(result.current.isChanged).toBe(true);
    });

    test('drops a staged file by its index', () => {
      const { result } = setup();
      act(() => result.current.onAddFiles([new File(['x'], 'one.csv'), new File(['x'], 'two.csv')]));

      act(() => result.current.onRemoveAddedFile(0));

      expect(result.current.addedFiles.map((file) => file.name)).toEqual(['two.csv']);
    });
  });

  describe('keeping and dropping edits', () => {
    test('keeps staged edits when the same files arrive in a new array', () => {
      const { result, rerender } = setup();
      act(() => result.current.onChangeDescription('New'));

      rerender({ manifestContent: MANIFEST, projectName: 'p', files: [...FILES] });

      expect(result.current.description).toBe('New');
    });

    test('drops staged edits when the project is read again with different content', () => {
      const { result, rerender } = setup();
      act(() => result.current.onChangeDescription('New'));
      act(() => result.current.onAddFiles([new File(['x'], 'new.csv')]));

      rerender({
        manifestContent: MANIFEST.replace('Original', 'Saved elsewhere'),
        projectName: 'p',
        files: FILES,
      });

      expect(result.current.description).toBe('Saved elsewhere');
      expect(result.current.addedFiles).toEqual([]);
    });

    test('drops staged edits when the set of stored files changes', () => {
      const { result, rerender } = setup();
      act(() => result.current.onRemoveStoredFile('a.csv'));

      rerender({ manifestContent: MANIFEST, projectName: 'p', files: [{ name: 'PROJECT.md' }] });

      expect(result.current.removedFileNames).toEqual([]);
    });

    test('discard reverts every staged edit', () => {
      const { result } = setup();
      act(() => result.current.onChangeDescription('New'));
      act(() => result.current.onChangeInstructions('Other'));
      act(() => result.current.onAddFiles([new File(['x'], 'new.csv')]));

      act(() => result.current.discard());

      expect(result.current.description).toBe('Original');
      expect(result.current.instructions).toBe('Be helpful.');
      expect(result.current.isChanged).toBe(false);
    });
  });

  describe('apply', () => {
    test('writes nothing when nothing is staged', async () => {
      const { result } = setup();

      await expect(result.current.apply('public/p')).resolves.toEqual({ success: true });
      expect(uploadProjectFile).not.toHaveBeenCalled();
      expect(removeProjectFile).not.toHaveBeenCalled();
    });

    test('writes the manifest, then removals, then additions, each under context/', async () => {
      const calls: string[] = [];
      vi.mocked(uploadProjectFile).mockImplementation(async (_path, filePath) => {
        calls.push(`upload:${filePath}`);
        return { success: true };
      });
      vi.mocked(removeProjectFile).mockImplementation(async (_path, filePath) => {
        calls.push(`remove:${filePath}`);
        return { success: true };
      });
      const { result } = setup();
      act(() => result.current.onChangeDescription('New'));
      act(() => result.current.onRemoveStoredFile('a.csv'));
      act(() => result.current.onAddFiles([new File(['x'], 'new.csv')]));

      await act(async () => {
        await result.current.apply('public/p');
      });

      expect(calls).toEqual(['upload:PROJECT.md', 'remove:context/a.csv', 'upload:context/new.csv']);
    });

    test('rewrites the manifest keeping frontmatter keys written elsewhere', async () => {
      const { result } = setup();
      act(() => result.current.onChangeDescription('New'));

      await act(async () => {
        await result.current.apply('public/p');
      });

      const formData = vi.mocked(uploadProjectFile).mock.calls[0][2];
      expect(await (formData.get('file') as File).text()).toBe(
        '---\nname: p\ndescription: New\nowner: team-a\n---\n\nBe helpful.',
      );
    });

    test('stops at the first failure and returns it', async () => {
      const failure = { success: false, errorHeader: 'Boom', errorMessage: 'nope' };
      vi.mocked(removeProjectFile).mockResolvedValue(failure);
      const { result } = setup();
      act(() => result.current.onRemoveStoredFile('a.csv'));
      act(() => result.current.onAddFiles([new File(['x'], 'new.csv')]));

      await expect(result.current.apply('public/p')).resolves.toBe(failure);
      expect(uploadProjectFile).not.toHaveBeenCalled();
    });
  });
});
