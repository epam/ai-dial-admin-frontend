import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateApplication } from '@/src/app/[lang]/applications/actions';
import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import {
  FRAME_ORIGIN,
  postFromFrame,
  spyOnFramePostMessage,
} from '@/src/components/FrameRenderer/tests/frame-test-utils';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { DialApplication } from '@/src/models/dial/application';
import { NotificationType } from '@/src/models/notification';
import ApplicationView from '../View';

const refresh = vi.fn();
const protectedRequest = vi.fn();
const showNotification = vi.mocked(useNotification().showNotification);

vi.mock('@/src/hooks/use-protected-request', () => ({ useProtectedRequest: () => protectedRequest }));
vi.mock('@/src/app/[lang]/applications/actions', () => ({
  getCoreApplication: vi.fn(),
  removeApplication: vi.fn(),
  updateApplication: vi.fn(),
  updateCoreApplication: vi.fn(),
}));
vi.mock('../TabsContent', async () => ({
  default: (await import('@/src/components/FrameRenderer/tests/frame-test-utils')).FrameTabsContentStub,
}));

const application = { name: 'quick-app' } as unknown as DialApplication;

const renderView = () =>
  render(
    <ApplicationView
      etag="etag"
      names={[]}
      originalApplication={application}
      applications={[]}
      interceptors={[]}
      models={[]}
      applicationSchemes={[]}
    />,
  );

const postDirty = (isDirty: boolean) => postFromFrame({ type: FrameMessageType.DirtyState, payload: { isDirty } });

const postValidity = (isValid: boolean) =>
  postFromFrame({ type: FrameMessageType.ValidityState, payload: { isValid } });

const getSave = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });
const getDiscard = () => screen.getByRole('button', { name: ButtonsI18nKey.Discard });

describe('ApplicationView — iframe Save and Discard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
    protectedRequest.mockResolvedValue({ response: {} });
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

  test('hides Save and Discard when the iframe becomes clean again', () => {
    renderView();
    postDirty(true);

    postDirty(false);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('sends TRIGGER_SAVE instead of saving the entity and disables Save while pending', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getSave());

    expect(postMessage).toHaveBeenCalledWith({ type: FrameMessageType.TriggerSave }, FRAME_ORIGIN);
    expect(updateApplication).not.toHaveBeenCalled();
    expect(getSave()).toBeDisabled();
  });

  test('notifies, refreshes and hides the buttons when the save succeeds', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    await user.click(getSave());

    postFromFrame({ type: FrameMessageType.SaveSuccess });

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('shows the error, keeps the buttons and re-enables Save when the save fails', async () => {
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
    expect(refresh).not.toHaveBeenCalled();
  });

  test('sends RESET when the discard is confirmed and hides the buttons once the iframe is clean', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    const postMessage = spyOnFramePostMessage();

    await user.click(getDiscard());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Discard }));
    postDirty(false);

    expect(postMessage).toHaveBeenCalledWith({ type: FrameMessageType.Reset }, FRAME_ORIGIN);
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });
});

describe('ApplicationView — iframe form validity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
    protectedRequest.mockResolvedValue({ response: {} });
  });

  test('keeps Save enabled when the iframe has reported nothing about validity', () => {
    renderView();

    postDirty(true);

    expect(getSave()).toBeEnabled();
  });

  test('disables Save but not Discard while the form is invalid', () => {
    renderView();
    postDirty(true);

    postValidity(false);

    expect(getSave()).toBeDisabled();
    expect(getDiscard()).toBeEnabled();
  });

  test('enables Save again when the form becomes valid', () => {
    renderView();
    postDirty(true);
    postValidity(false);

    postValidity(true);

    expect(getSave()).toBeEnabled();
  });

  test('sends nothing when Save is attempted on an invalid form', async () => {
    const user = userEvent.setup();
    renderView();
    postDirty(true);
    postValidity(false);
    const postMessage = spyOnFramePostMessage();

    await user.click(getSave());

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a validity message from another origin', () => {
    renderView();
    postDirty(true);

    postFromFrame(
      { type: FrameMessageType.ValidityState, payload: { isValid: false } },
      { origin: 'https://evil.example.com' },
    );

    expect(getSave()).toBeEnabled();
  });
});
