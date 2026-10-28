import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Editor from '@/src/components/Common/MonacoEditor/Editor';
import { getLoadedMonaco, loadMonaco, setMonacoTranslate } from '@/src/components/Common/MonacoEditor/load-monaco';
import type { BundledMonaco } from '@/src/components/Common/MonacoEditor/models';
import { BasicI18nKey } from '@/src/constants/i18n';

vi.unmock('@/src/components/Common/MonacoEditor/Editor');
vi.mock('@/src/components/Common/MonacoEditor/load-monaco', () => ({
  getLoadedMonaco: vi.fn(),
  loadMonaco: vi.fn(),
  setMonacoTranslate: vi.fn(),
}));

const VALUE = '{"name":"model"}';

describe('Editor', () => {
  let resolveLoad: (monaco: BundledMonaco) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLoadedMonaco).mockReturnValue(null);
    vi.mocked(loadMonaco).mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
  });

  const renderEditor = () => render(<Editor value={VALUE} language="json" />);

  test('mounts the library editor with the caller props only after Monaco has loaded', async () => {
    renderEditor();

    expect(screen.queryByText(VALUE)).toBeNull();
    await act(async () => resolveLoad({} as BundledMonaco));

    const editor = await screen.findByText(VALUE);
    expect(editor.getAttribute('data-language')).toBe('json');
    expect(screen.queryByRole('img', { name: BasicI18nKey.Loading })).toBeNull();
  });

  test('shows the loading spinner while Monaco loads', () => {
    renderEditor();

    expect(screen.getByRole('img', { name: BasicI18nKey.Loading })).toBeTruthy();
  });

  test('loads Monaco in the app locale and registers the app translator', async () => {
    renderEditor();
    await act(async () => resolveLoad({} as BundledMonaco));

    expect(await screen.findByText(VALUE)).toBeTruthy();
    expect(loadMonaco).toHaveBeenCalledWith('en');
    expect(setMonacoTranslate).toHaveBeenCalledOnce();
  });

  test('mounts at once when Monaco is already loaded', () => {
    vi.mocked(getLoadedMonaco).mockReturnValue({} as BundledMonaco);

    renderEditor();

    expect(screen.getByText(VALUE)).toBeTruthy();
    expect(loadMonaco).not.toHaveBeenCalled();
  });
});
