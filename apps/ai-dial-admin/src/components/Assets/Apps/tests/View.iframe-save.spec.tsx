import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createApp } from '@/src/app/[lang]/assets-applications/actions';
import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import {
  FRAME_ORIGIN,
  postFromFrame,
  spyOnFramePostMessage,
} from '@/src/components/FrameRenderer/tests/frame-test-utils';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { NotificationType } from '@/src/models/notification';
import AppView from '../View';

const refresh = vi.fn();
const fetchFiles = vi.fn();
const protectedRequest = vi.fn();
const showNotification = vi.mocked(useNotification().showNotification);

vi.mock('@/src/context/assets/AppsFolderContext', () => ({ useAppsFolder: vi.fn() }));
vi.mock('@/src/hooks/use-protected-request', () => ({ useProtectedRequest: () => protectedRequest }));
vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApps: vi.fn(),
  moveApps: vi.fn(),
  removeApp: vi.fn(),
  updateApp: vi.fn(),
  createApp: vi.fn(),
}));
vi.mock('@/src/components/Applications/View/TabsContent', async () => ({
  default: (await import('@/src/components/FrameRenderer/tests/frame-test-utils')).FrameTabsContentStub,
}));

const application = {
  id: 'app-1',
  name: 'Test App',
  version: '1.0.0',
  folderId: '/folder/',
  path: '/folder/app-1',
} as AssetApp;

const renderView = () =>
  render(
    <AppView
      etag="etag"
      originalApp={application}
      assets={[application]}
      models={[]}
      applications={[]}
      schemes={[]}
      interceptors={[]}
    />,
  );

const postDirty = (isDirty: boolean) => postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty } });

const postValidity = (isValid: boolean) =>
  postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid } });

const getSave = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });
const getSaveAsNewVersion = () => screen.getByRole('button', { name: ButtonsI18nKey.SaveAsNewVersion });
const getDiscard = () => screen.getByRole('button', { name: ButtonsI18nKey.Discard });

describe('AppView — iframe Save and Discard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh, push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAppsFolder).mockReturnValue({ fetchFiles } as unknown as ReturnType<typeof useAppsFolder>);
    protectedRequest.mockResolvedValue({ success: false });
  });

  test('hides Save and Discard while the iframe is clean', () => {
    renderView();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });

  test('shows an enabled Save and Discard once the iframe is dirty', () => {
    renderView();

    postDirty(true);

    expect(getSave()).toBeEnabled();
    expect(getDiscard()).toBeEnabled();
  });

  test('sends TRIGGER_SAVE instead of saving the entity and disables both save buttons while pending', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getSave());

    expect(postMessage).toHaveBeenCalledWith({ type: FrameMessageType.TriggerSave }, FRAME_ORIGIN);
    expect(protectedRequest).not.toHaveBeenCalled();
    expect(getSave()).toBeDisabled();
    expect(getSaveAsNewVersion()).toBeDisabled();
  });

  test('keeps the entity path for Save as new version while the iframe is dirty', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getSaveAsNewVersion());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(protectedRequest).toHaveBeenCalledWith(createApp, expect.anything(), 'etag');
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('notifies, refetches the folder, refreshes and hides the buttons when the save succeeds', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    await user.click(getSave());

    postFromFrame({ type: FrameMessageType.SaveSuccess });

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(fetchFiles).toHaveBeenCalledWith('/folder/');
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('shows the error and re-enables Save when the save fails', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    await user.click(getSave());

    postFromFrame({ type: FrameMessageType.SaveError, payload: { error: 'boom' } });

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.error,
        title: EntitiesI18nKey.IframeSaveFailed,
        description: 'boom',
      }),
    );
    expect(getSave()).toBeEnabled();
    expect(fetchFiles).not.toHaveBeenCalled();
  });

  test('sends RESET when the discard is confirmed', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getDiscard());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(postMessage).toHaveBeenCalledWith({ type: FrameMessageType.Reset }, FRAME_ORIGIN);
  });
});

describe('AppView — iframe form validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh, push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAppsFolder).mockReturnValue({ fetchFiles } as unknown as ReturnType<typeof useAppsFolder>);
    protectedRequest.mockResolvedValue({ success: false });
  });

  test('keeps Save enabled when the iframe has reported nothing about validity', () => {
    renderView();

    postDirty(true);

    expect(getSave()).toBeEnabled();
  });

  test('disables Save but neither Discard nor Save as new version while the form is invalid', () => {
    renderView();
    postDirty(true);

    postValidity(false);

    expect(getSave()).toBeDisabled();
    expect(getDiscard()).toBeEnabled();
    expect(getSaveAsNewVersion()).toBeEnabled();
  });

  test('enables Save again when the form becomes valid', () => {
    renderView();
    postDirty(true);
    postValidity(false);

    postValidity(true);

    expect(getSave()).toBeEnabled();
  });
});
