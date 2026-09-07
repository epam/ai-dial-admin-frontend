import { type ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import TestSuiteProperties from '../Properties';

const getDeploymentByIdMock = vi.fn();
const getDeploymentsMock = vi.fn();
const getAllDeploymentsMock = vi.fn();
const onOpenInNewTabMock = vi.fn();
const onChangeMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
  getDeployments: (...args: unknown[]) => getDeploymentsMock(...args),
}));

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getAllDeployments: (...args: unknown[]) => getAllDeploymentsMock(...args),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  onOpenInNewTab: (...args: unknown[]) => onOpenInNewTabMock(...args),
}));

vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: () => <div>DisplayName</div>,
}));

vi.mock('@/src/components/BaseControls/Description', () => ({
  default: () => <div>Description</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/Create/CreateTestSuite', () => ({
  default: () => <div>CreateTestSuite</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialInputPopup: ({ children, selectedValue }: { children?: ReactNode; selectedValue?: string }) => (
      <div>
        <div>{selectedValue}</div>
        {children}
      </div>
    ),
    DialNeutralButton: ({ label, onClick }: { label?: string; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    ),
  };
});

describe('TestSuiteProperties', () => {
  beforeEach(() => {
    getDeploymentByIdMock.mockReset();
    getDeploymentsMock.mockReset();
    getAllDeploymentsMock.mockReset();
    onOpenInNewTabMock.mockReset();
    onChangeMock.mockReset();
  });

  test('Open uses stored deploymentRef.type without list or catalog calls', async () => {
    const user = userEvent.setup();

    render(
      <TestSuiteProperties
        testSuite={{
          deploymentRef: {
            id: 'app-1',
            name: 'My App',
            type: DeploymentType.Application,
          },
        }}
        onChange={onChangeMock}
      />,
    );

    const openButton = await screen.findByRole('button', { name: ButtonsI18nKey.Open });
    await user.click(openButton);

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.Applications, { name: 'app-1' });
    expect(getDeploymentsMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
  });

  test('missing type triggers one getDeploymentById call then enables Open', async () => {
    getDeploymentByIdMock.mockResolvedValue({
      $type: DeploymentType.Model,
      deploymentId: 'gpt-4',
    });

    const user = userEvent.setup();

    render(
      <TestSuiteProperties
        testSuite={{
          deploymentRef: { id: 'gpt-4', name: 'GPT-4' },
        }}
        onChange={onChangeMock}
      />,
    );

    await waitFor(() => {
      expect(getDeploymentByIdMock).toHaveBeenCalledTimes(1);
      expect(getDeploymentByIdMock).toHaveBeenCalledWith('gpt-4');
    });

    const openButton = await screen.findByRole('button', { name: ButtonsI18nKey.Open });
    await user.click(openButton);

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'gpt-4' });
    expect(getDeploymentsMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('hides Open when type cannot be resolved', async () => {
    getDeploymentByIdMock.mockResolvedValue(null);

    render(
      <TestSuiteProperties
        testSuite={{
          deploymentRef: { id: 'missing', name: 'Missing' },
        }}
        onChange={onChangeMock}
      />,
    );

    await waitFor(() => {
      expect(getDeploymentByIdMock).toHaveBeenCalled();
    });

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Open })).not.toBeInTheDocument();
    expect(getDeploymentsMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('does not fetch deployments in modal mode', () => {
    render(
      <TestSuiteProperties
        isModal
        testSuite={{
          deploymentRef: { id: 'app-1', name: 'My App' },
        }}
        onChange={onChangeMock}
      />,
    );

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Open })).not.toBeInTheDocument();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
    expect(getDeploymentsMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });
});
