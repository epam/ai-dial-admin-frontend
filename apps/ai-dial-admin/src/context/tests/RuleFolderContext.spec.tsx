import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getFolders, getRules } from '@/src/app/[lang]/folders-storage/actions';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';

vi.unmock('@/src/context/RuleFolderContext');
vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  getFolders: vi.fn(),
  getRules: vi.fn(),
}));

const renderProvider = async () => {
  const { RuleFolderProvider, useRuleFolder } =
    await vi.importActual<typeof import('../RuleFolderContext')>('../RuleFolderContext');

  const Probe = () => {
    const { fetchFiles, fetchFolderHierarchy } = useRuleFolder();
    return (
      <div>
        <button onClick={() => fetchFiles('public/')}>fetch</button>
        <button onClick={() => fetchFolderHierarchy?.('public/Acme/')}>hierarchy</button>
      </div>
    );
  };

  render(
    <RuleFolderProvider>
      <Probe />
    </RuleFolderProvider>,
  );
};

describe('RuleFolderProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFolders).mockResolvedValue([]);
    vi.mocked(getRules).mockResolvedValue({ success: true, response: {} });
  });

  test('asks the org units context to load units when the tree is first fetched', async () => {
    const user = userEvent.setup();
    await renderProvider();
    const { ensureUnits } = useOrgUnits();
    expect(ensureUnits).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'fetch' }));

    expect(ensureUnits).toHaveBeenCalledOnce();
  });

  test('asks for units when it loads a folder hierarchy', async () => {
    const user = userEvent.setup();
    await renderProvider();
    const { ensureUnits } = useOrgUnits();

    await user.click(screen.getByRole('button', { name: 'hierarchy' }));

    expect(ensureUnits).toHaveBeenCalledOnce();
  });
});
