import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updatePlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
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
import PlatformApplicationView from '../View';

const refresh = vi.fn();
const fetchFiles = vi.fn();
const showNotification = vi.mocked(useNotification().showNotification);

vi.mock('@/src/context/assets/AppsFolderContext', () => ({ useAppsFolder: vi.fn() }));
vi.mock('@/src/hooks/use-protected-request', () => ({ useProtectedRequest: () => vi.fn() }));
vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  removePlatformApplication: vi.fn(),
  updatePlatformApplication: vi.fn(),
}));
vi.mock('@/src/components/Applications/View/TabsContent', async () => ({
  default: (await import('@/src/components/FrameRenderer/tests/frame-test-utils')).FrameTabsContentStub,
}));

const application = {
  name: 'platform-app',
  version: '',
  folderId: 'platform/',
  path: 'platform/platform-app',
} as AssetApp;

const renderView = () =>
  render(
    <PlatformApplicationView
      etag="etag"
      originalApp={application}
      models={[]}
      applications={[]}
      schemes={[]}
      roles={[]}
      interceptors={[]}
    />,
  );

const postDirty = (isDirty: boolean) => postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty } });

const postValidity = (isValid: boolean) =>
  postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid } });

const getSave = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });
const getDiscard = () => screen.getByRole('button', { name: ButtonsI18nKey.Discard });

describe('PlatformApplicationView — iframe Save and Discard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAppsFolder).mockReturnValue({ fetchFiles } as unknown as ReturnType<typeof useAppsFolder>);
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

  test('sends TRIGGER_SAVE instead of saving the entity and disables Save while pending', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getSave());

    expect(postMessage).toHaveBeenCalledWith({ type: FrameMessageType.TriggerSave }, FRAME_ORIGIN);
    expect(updatePlatformApplication).not.toHaveBeenCalled();
    expect(getSave()).toBeDisabled();
  });

  test('notifies, refetches the folder, refreshes and hides the buttons when the save succeeds', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    await user.click(getSave());

    postFromFrame({ type: FrameMessageType.SaveSuccess });

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(fetchFiles).toHaveBeenCalledWith('platform/');
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('shows the error and re-enables Save when the save fails', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    await user.click(getSave());

    postFromFrame({ type: FrameMessageType.SaveError, error: 'flat boom' });

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.error,
        title: EntitiesI18nKey.IframeSaveFailed,
        description: 'flat boom',
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

describe('PlatformApplicationView — iframe form validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAppsFolder).mockReturnValue({ fetchFiles } as unknown as ReturnType<typeof useAppsFolder>);
  });

  test('keeps Save enabled when the iframe has reported nothing about validity', () => {
    renderView();

    postDirty(true);

    expect(getSave()).toBeEnabled();
  });

  test('disables Save but not Discard while the form is invalid, and re-enables it when valid', () => {
    renderView();
    postDirty(true);

    postValidity(false);
    expect(getSave()).toBeDisabled();
    expect(getDiscard()).toBeEnabled();

    postValidity(true);
    expect(getSave()).toBeEnabled();
  });
});
