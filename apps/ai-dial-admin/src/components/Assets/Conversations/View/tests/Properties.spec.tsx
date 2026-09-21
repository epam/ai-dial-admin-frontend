import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialConversation } from '@/src/models/dial/conversation';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import Properties from '../Properties';

const getDeploymentMock = vi.fn();
const getAllDeploymentsMock = vi.fn();
const getModelMock = vi.fn();
const windowOpenMock = vi.fn();

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getDeployment: (...args: unknown[]) => getDeploymentMock(...args),
  getAllDeployments: (...args: unknown[]) => getAllDeploymentsMock(...args),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getModelMock(...args),
}));

describe('Assets Conversations :: Properties', () => {
  beforeEach(() => {
    getDeploymentMock.mockReset();
    getAllDeploymentsMock.mockReset();
    getModelMock.mockReset();
    getModelMock.mockResolvedValue(null);
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

  test('loads agent via getDeployment and opens type-based link', async () => {
    getDeploymentMock.mockResolvedValue({
      $type: DeploymentType.Model,
      deploymentId: 'gpt-4',
      displayName: 'GPT-4',
    });

    const user = userEvent.setup();

    render(<Properties selectedConversation={conversation({ id: 'gpt-4' })} />);

    await waitFor(() => {
      expect(getDeploymentMock).toHaveBeenCalledWith('gpt-4');
    });

    expect(getAllDeploymentsMock).not.toHaveBeenCalled();

    const openButton = await screen.findByRole('button');
    await user.click(openButton);

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.Models}/${encodeURIComponent('gpt-4')}`,
      '_blank',
    );
  });

  test('opens Catalog model link when platform model exists', async () => {
    getDeploymentMock.mockResolvedValue({
      $type: DeploymentType.Model,
      deploymentId: 'msh-responses',
      displayName: 'msh-responses',
    });
    getModelMock.mockResolvedValue({ response: { name: 'msh-responses' } });

    const user = userEvent.setup();

    render(<Properties selectedConversation={conversation({ id: 'msh-responses' })} />);

    const openButton = await screen.findByRole('button');
    await user.click(openButton);

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.PlatformModels}/${encodeURIComponent('msh-responses')}`,
      '_blank',
    );
  });

  test('hides external link when by-name lookup fails', async () => {
    getDeploymentMock.mockResolvedValue(null);

    render(<Properties selectedConversation={conversation({ id: 'missing' })} />);

    await waitFor(() => {
      expect(getDeploymentMock).toHaveBeenCalledWith('missing');
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });
});
