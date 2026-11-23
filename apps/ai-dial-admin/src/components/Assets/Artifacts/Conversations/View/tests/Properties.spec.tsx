import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialConversation } from '@/src/models/dial/conversation';
import { ApplicationRoute } from '@/src/types/routes';
import Properties from '../Properties';

const getDeploymentMock = vi.fn();
const getModelMock = vi.fn();
const getPlatformApplicationMock = vi.fn();
const windowOpenMock = vi.fn();

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getDeployment: (...args: unknown[]) => getDeploymentMock(...args),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getModelMock(...args),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getPlatformApplication: (...args: unknown[]) => getPlatformApplicationMock(...args),
}));

describe('Assets Conversations :: Properties', () => {
  beforeEach(() => {
    getDeploymentMock.mockReset();
    getModelMock.mockReset();
    getModelMock.mockResolvedValue(null);
    getPlatformApplicationMock.mockReset();
    getPlatformApplicationMock.mockResolvedValue(null);
    windowOpenMock.mockReset();
    vi.stubGlobal('open', windowOpenMock);
  });

  const conversation = (model: { id: string }): DialConversation => ({
    name: 'Chat',
    descriptionKeywords: [],
    endpoint: '',
    iconUrl: '',
    temperature: 0,
    messages: [],
    path: 'conversations/public/Chat',
    folderId: 'public',
    author: 'someone',
    model,
  });

  const renderProperties = (id: string) => render(<Properties selectedConversation={conversation({ id })} />);

  const openAgentLink = async () => {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button'));
  };

  test('shows loading until the model route probe resolves, then opens the probed route', async () => {
    let resolveProbe: (value: unknown) => void = () => {};
    getDeploymentMock.mockResolvedValue({ object: 'model', id: 'gpt-4' });
    getModelMock.mockReturnValue(new Promise((resolve) => (resolveProbe = resolve)));

    renderProperties('gpt-4');

    await vi.waitFor(() => expect(getModelMock).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();

    await act(async () => resolveProbe(null));
    await openAgentLink();

    expect(getDeploymentMock).toHaveBeenCalledWith('gpt-4');
    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.Models}/${encodeURIComponent('gpt-4')}`,
      '_blank',
    );
  });

  test('opens the Catalog model link when the platform model exists', async () => {
    getDeploymentMock.mockResolvedValue({ object: 'model', id: 'msh-responses' });
    getModelMock.mockResolvedValue({ response: { name: 'msh-responses' } });

    renderProperties('msh-responses');
    await openAgentLink();

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.PlatformModels}/${encodeURIComponent('msh-responses')}`,
      '_blank',
    );
  });

  test('opens Assets Applications without the prefix for a custom application', async () => {
    getDeploymentMock.mockResolvedValue({ object: 'application', id: 'applications/bucket/app' });

    renderProperties('applications/bucket/app');
    await openAgentLink();

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.AssetsApplications}/${encodeURIComponent('applications/bucket/app')}?path=${encodeURIComponent('bucket/app')}`,
      '_blank',
    );
  });

  test('opens Applications for a config-defined application whose reference differs from its id', async () => {
    getDeploymentMock.mockResolvedValue({
      object: 'application',
      id: 'my-app',
      application: 'my-app',
      reference: 'ref-1',
    });

    renderProperties('my-app');
    await openAgentLink();

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.Applications}/${encodeURIComponent('my-app')}`,
      '_blank',
    );
    expect(getModelMock).not.toHaveBeenCalled();
  });

  test('shows the agent without a link and logs the error when the lookup fails', async () => {
    const error = new Error('Network error');
    vi.mocked(console.error).mockClear();
    getDeploymentMock.mockRejectedValue(error);

    renderProperties('gpt-4');

    expect(await screen.findByText('gpt-4')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Getting conversation deployment error:', error);
  });

  test('offers no external link when the lookup finds no deployment', async () => {
    getDeploymentMock.mockResolvedValue(null);

    render(<Properties selectedConversation={conversation({ id: 'missing' })} />);

    await vi.waitFor(() => expect(getDeploymentMock).toHaveBeenCalledWith('missing'));
    await act(async () => {});

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
