import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import Properties from '../Properties';

const getDeploymentByIdMock = vi.fn();
const getAllDeploymentsMock = vi.fn();
const windowOpenMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
}));

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getAllDeployments: (...args: unknown[]) => getAllDeploymentsMock(...args),
}));

describe('Assets Conversations :: Properties', () => {
  beforeEach(() => {
    getDeploymentByIdMock.mockReset();
    getAllDeploymentsMock.mockReset();
    windowOpenMock.mockReset();
    vi.stubGlobal('open', windowOpenMock);
  });

  test('loads agent via getDeploymentById and opens type-based link', async () => {
    getDeploymentByIdMock.mockResolvedValue({
      $type: DeploymentType.Model,
      deploymentId: 'gpt-4',
      displayName: 'GPT-4',
    });

    const user = userEvent.setup();

    render(
      <Properties
        selectedConversation={{
          name: 'Chat',
          version: '1.0.0',
          model: { id: 'gpt-4' },
        }}
      />,
    );

    await waitFor(() => {
      expect(getDeploymentByIdMock).toHaveBeenCalledWith('gpt-4');
    });

    expect(getAllDeploymentsMock).not.toHaveBeenCalled();

    const openButton = await screen.findByRole('button');
    await user.click(openButton);

    expect(windowOpenMock).toHaveBeenCalledWith(
      `/en${ApplicationRoute.Models}/${encodeURIComponent('gpt-4')}`,
      '_blank',
    );
  });

  test('hides external link when by-id lookup fails', async () => {
    getDeploymentByIdMock.mockResolvedValue(null);

    render(
      <Properties
        selectedConversation={{
          name: 'Chat',
          version: '1.0.0',
          model: { id: 'missing' },
        }}
      />,
    );

    await waitFor(() => {
      expect(getDeploymentByIdMock).toHaveBeenCalledWith('missing');
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });
});
