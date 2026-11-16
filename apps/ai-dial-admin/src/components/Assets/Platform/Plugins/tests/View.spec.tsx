import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updatePlugin } from '@/src/app/[lang]/platform-plugins/actions';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { DialPluginResource } from '@/src/models/dial/resource';
import PluginAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-plugins/actions', () => ({
  updatePlugin: vi.fn(),
  removePlugin: vi.fn(),
  getPlugins: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave, onDiscard, isChanged, entity }: any) => (
    <div>
      <span>changed:{String(isChanged)}</span>
      <span>type:{entity.type}</span>
      <button type="button" onClick={onSave}>
        save
      </button>
      <button type="button" onClick={onDiscard}>
        discard
      </button>
    </div>
  ),
}));

vi.mock('../TabsContent', () => ({
  default: ({ selectedPlugin, onChange }: any) => (
    <button type="button" onClick={() => onChange({ ...selectedPlugin, type: 'edited' })}>
      edit
    </button>
  ),
}));

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const plugin = (): DialPluginResource =>
  ({
    type: 'forward',
    settings: {},
    _metadata: { name: 'my-plugin', path: 'my-plugin', folderId: '' },
  }) as DialPluginResource;

const renderView = (props: { isConfigFileSource?: boolean } = {}) =>
  render(<PluginAssetView etag="etag" originalPlugin={plugin()} {...props} />);

describe('PluginAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updatePlugin).mockResolvedValue({ success: true } as any);
  });

  test('starts unchanged and becomes changed after an edit', async () => {
    const user = userEvent.setup();
    renderView();

    expect(screen.getByText('changed:false')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'edit' }));

    expect(await screen.findByText('changed:true')).toBeInTheDocument();
  });

  test('discard restores the loaded values', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(await screen.findByText('type:edited')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'discard' }));

    expect(await screen.findByText('type:forward')).toBeInTheDocument();
  });

  test('saves the edited plugin with its etag and refreshes the view', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(updatePlugin).toHaveBeenCalledWith(expect.objectContaining({ type: 'edited' }), 'etag');
  });

  test("shows Core's message when the save is rejected and keeps the edits", async () => {
    vi.mocked(updatePlugin).mockResolvedValue({
      success: false,
      errorHeader: 'Unprocessable Entity',
      errorMessage: 'Unknown plugin type',
    } as any);
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() =>
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Unknown plugin type' }),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByText('type:edited')).toBeInTheDocument();
  });

  test('marks the entity read-only for a config-file source', () => {
    renderView({ isConfigFileSource: true });

    expect(useAppContext().setEntityReadOnly).toHaveBeenCalledWith(true);
  });
});
