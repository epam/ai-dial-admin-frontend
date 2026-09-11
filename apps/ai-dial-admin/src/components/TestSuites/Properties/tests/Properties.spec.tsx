import { type ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import TestSuiteProperties from '../Properties';

const getDeploymentByIdMock = vi.fn();
const getDeploymentsMock = vi.fn();
const getAllDeploymentsMock = vi.fn();
const getModelMock = vi.fn();
const onOpenInNewTabMock = vi.fn();
const onChangeMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
  getDeployments: (...args: unknown[]) => getDeploymentsMock(...args),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getModelMock(...args),
}));

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getAllDeployments: (...args: unknown[]) => getAllDeploymentsMock(...args),
}));

vi.mock('@/src/utils/open-in-new-tab', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/utils/open-in-new-tab')>();
  return {
    ...actual,
    onOpenInNewTab: (...args: unknown[]) => onOpenInNewTabMock(...args),
  };
});

vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: () => <div>DisplayName</div>,
}));

vi.mock('@/src/components/BaseControls/Description', () => ({
  default: () => <div>Description</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/Create/CreateTestSuite', () => ({
  default: ({ currentEntity, onCreate }: { currentEntity: TestSuite; onCreate: (suite: TestSuite) => void }) => (
    <button type="button" onClick={() => onCreate(currentEntity)}>
      Finish update
    </button>
  ),
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
    getModelMock.mockReset();
    getModelMock.mockResolvedValue(null);
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
    getModelMock.mockResolvedValue(null);

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

  test('Open for Catalog model uses PlatformModels when platform resource exists', async () => {
    getModelMock.mockResolvedValue({ response: { name: 'msh-responses' } });
    const user = userEvent.setup();

    render(
      <TestSuiteProperties
        testSuite={{
          deploymentRef: { id: 'msh-responses', name: 'msh-responses', type: DeploymentType.Model },
        }}
        onChange={onChangeMock}
      />,
    );

    const openButton = await screen.findByRole('button', { name: ButtonsI18nKey.Open });
    await user.click(openButton);

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.PlatformModels, { name: 'msh-responses' });
    expect(getModelMock).toHaveBeenCalled();
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

  test('finishing the target picker without a target change preserves a hand-edited model', async () => {
    const user = userEvent.setup();
    const suite = {
      deploymentRef: { id: 'app-1', name: 'My App', type: DeploymentType.Application },
      endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      requestTemplate: { body: { content: { model: 'hand-edited', input: 'hello' } } },
    } as TestSuite;

    render(<TestSuiteProperties testSuite={suite} onChange={onChangeMock} />);

    await user.click(screen.getByRole('button', { name: 'Finish update' }));

    expect(onChangeMock).toHaveBeenCalledWith(suite);
  });

  test('Open for MCP asset toolset uses mcpDeploymentRef without by-id lookup', async () => {
    const user = userEvent.setup();

    render(
      <TestSuiteProperties
        testSuite={{
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: {
            id: 'toolsets/public/developers/sf_test/calculator__1.0.0',
            type: 'dial-toolset',
            name: 'calculator',
          },
        }}
        onChange={onChangeMock}
      />,
    );

    const openButton = await screen.findByRole('button', { name: ButtonsI18nKey.Open });
    await user.click(openButton);

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.AssetsToolsets, {
      name: 'calculator',
      path: 'public/developers/sf_test/calculator__1.0.0',
    });
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
    expect(getDeploymentsMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });
});
