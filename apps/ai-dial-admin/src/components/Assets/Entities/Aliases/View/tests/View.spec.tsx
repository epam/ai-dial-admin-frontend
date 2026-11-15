import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { removeAlias, updateAlias } from '@/src/app/[lang]/assets-aliases/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AliasHealthReason } from '@/src/models/dial/config-health';
import { NotificationType } from '@/src/models/notification';
import AliasView from '../View';

const setEntityReadOnly = vi.hoisted(() => vi.fn());

vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => ({ setEntityReadOnly }) }));
vi.mock('@/src/app/[lang]/assets-aliases/actions', () => ({ updateAlias: vi.fn(), removeAlias: vi.fn() }));
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest:
    () =>
    (action: (...args: unknown[]) => unknown, ...args: unknown[]) =>
      action(...args),
}));
vi.mock('@/src/context/assets/AliasesFolderContext', () => ({ useAliasesFolder: () => ({ fetchFiles: vi.fn() }) }));

// Stand-ins for the header and the editor: expose the callbacks the view hands them.
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({
    view,
    isChanged,
    tabs,
    onSave,
    onDiscard,
    onRemove,
    jsonConfiguration,
  }: {
    view: string;
    isChanged: boolean;
    tabs: unknown[];
    onSave: () => void;
    onDiscard: () => void;
    onRemove: (path: string, etag?: string) => void;
    jsonConfiguration: { onHideFormatSelector: () => boolean };
  }) => (
    <div>
      <span>{`header:${view}:tabs=${tabs.length}:changed=${String(isChanged)}`}</span>
      <span>{`format-selector-hidden:${String(jsonConfiguration.onHideFormatSelector())}`}</span>
      <button onClick={onSave}>save</button>
      <button onClick={onDiscard}>discard</button>
      <button onClick={() => onRemove('platform/assistant-v1', 'etag-1')}>remove</button>
    </div>
  ),
}));
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>json-editor</div>,
}));
vi.mock('../TabsContent', () => ({
  default: ({
    selectedAlias,
    healthIssue,
    onChange,
  }: {
    selectedAlias: DialAliasResource;
    healthIssue?: { reason: string };
    onChange: (alias: DialAliasResource) => void;
  }) => (
    <div>
      <span>{`content:${selectedAlias.displayName ?? ''}:${healthIssue?.reason ?? 'healthy'}`}</span>
      <button onClick={() => onChange({ ...selectedAlias, displayName: 'Edited' })}>edit</button>
    </div>
  ),
}));

const ALIAS: DialAliasResource = {
  name: 'assistant-v1',
  displayName: 'Assistant',
  target: { path: 'models/gpt' },
  _metadata: { name: 'assistant-v1', path: 'platform/assistant-v1', folderId: 'platform/' },
};

describe('AliasView', () => {
  const refresh = vi.fn();
  const { showNotification } = useNotification();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as never);
    vi.mocked(updateAlias).mockResolvedValue({ success: true } as never);
  });

  const renderView = (props?: Partial<Parameters<typeof AliasView>[0]>) =>
    render(<AliasView etag="etag-1" originalAlias={ALIAS} roles={[]} {...props} />);

  test('shows the properties of the alias under the aliases header, with only the Properties tab', () => {
    renderView();

    expect(screen.getByText('header:/assets-aliases:tabs=3:changed=false')).toBeTruthy();
    expect(screen.getByText('content:Assistant:healthy')).toBeTruthy();
  });

  test('hands the health entry of Core down to the content', () => {
    renderView({ healthIssue: { id: 'aliases/assistant-v1', reason: AliasHealthReason.TargetMissing } });

    expect(screen.getByText(`content:Assistant:${AliasHealthReason.TargetMissing}`)).toBeTruthy();
  });

  test('marks the view changed after an edit and unchanged again after a discard', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(await screen.findByText('header:/assets-aliases:tabs=3:changed=true')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'discard' }));
    expect(await screen.findByText('header:/assets-aliases:tabs=3:changed=false')).toBeTruthy();
    expect(screen.getByText('content:Assistant:healthy')).toBeTruthy();
  });

  test('saves the edited alias with the etag it was loaded with, then refreshes', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(updateAlias).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Edited' }), 'etag-1');
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
  });

  test('shows the refusal of Core, such as a stale etag, and keeps the edit', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAlias).mockResolvedValue({
      success: false,
      errorHeader: 'Precondition Failed',
      errorMessage: 'etag mismatch',
    } as never);
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.error, title: 'Precondition Failed' }),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByText('content:Edited:healthy')).toBeTruthy();
  });

  test('removes through the alias action', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'remove' }));

    expect(removeAlias).toHaveBeenCalledWith('platform/assistant-v1', 'etag-1');
  });

  describe('a config.json alias', () => {
    test('makes the entity read-only while it is shown, and not after', () => {
      const { unmount } = renderView({ isConfigFileSource: true });

      expect(setEntityReadOnly).toHaveBeenLastCalledWith(true);

      unmount();
      expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
    });

    test('hides the format selector, since it is already how Core sees it', () => {
      renderView({ isConfigFileSource: true });

      expect(screen.getByText('format-selector-hidden:true')).toBeTruthy();
    });

    test('leaves a stored alias editable', () => {
      renderView();

      expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
      expect(screen.getByText('format-selector-hidden:false')).toBeTruthy();
    });
  });
});
