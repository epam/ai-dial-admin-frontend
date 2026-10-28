import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DiffEditor from '@/src/components/Common/MonacoEditor/DiffEditor';
import { getLoadedMonaco, loadMonaco } from '@/src/components/Common/MonacoEditor/load-monaco';
import type { BundledMonaco } from '@/src/components/Common/MonacoEditor/models';
import { BasicI18nKey } from '@/src/constants/i18n';

vi.unmock('@/src/components/Common/MonacoEditor/DiffEditor');
vi.mock('@/src/components/Common/MonacoEditor/load-monaco', () => ({
  getLoadedMonaco: vi.fn(),
  loadMonaco: vi.fn(),
  setMonacoTranslate: vi.fn(),
}));

const MODIFIED = '{"name":"modified"}';

describe('DiffEditor', () => {
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

  test('mounts the library diff editor with the caller props only after Monaco has loaded', async () => {
    render(<DiffEditor original="{}" modified={MODIFIED} language="json" />);

    expect(screen.queryByText(MODIFIED)).toBeNull();
    expect(screen.getByRole('img', { name: BasicI18nKey.Loading })).toBeTruthy();
    await act(async () => resolveLoad({} as BundledMonaco));

    const editor = await screen.findByText(MODIFIED);
    expect(editor.getAttribute('data-language')).toBe('json');
    expect(loadMonaco).toHaveBeenCalledWith('en');
  });
});
