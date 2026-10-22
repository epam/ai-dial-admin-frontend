import { Dispatch, ReactNode, SetStateAction } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { TestSuitTab } from '@/src/components/TestSuites/Modals/Create/constants';

const getTestSuiteByNameMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteByName: (...args: unknown[]) => getTestSuiteByNameMock(...args),
}));

vi.mock('@/src/components/TestSuites/Properties/Properties', () => ({
  default: () => <div>Properties content</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/Create/Target', () => ({
  default: ({ onChange }: { onChange: Dispatch<SetStateAction<TestSuite>> }) => (
    <button
      type="button"
      onClick={() =>
        onChange((previous) => ({
          ...previous,
          suiteType: SuiteType.Route,
          routesRef: { name: 'routes/platform/search-route' },
        }))
      }
    >
      Select route
    </button>
  ),
}));

vi.mock('@/src/components/TestSuites/Methods/RouteMethods', () => ({
  default: ({ routeName }: { routeName: string }) => <div>Route methods:{routeName}</div>,
}));

vi.mock('@/src/components/TestSuites/Methods/Methods', () => ({
  default: () => <div>Deployment methods</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/Create/McpTool', () => ({
  default: () => <div>MCP tools</div>,
}));

vi.mock('@/src/components/Common/StepperModalButtons/StepperModalButtons', () => ({
  default: ({ currentStep, onNextStep }: { currentStep?: Step; onNextStep?: () => void }) => (
    <button type="button" disabled={currentStep?.status !== StepStatus.VALID} onClick={onNextStep}>
      {ButtonsI18nKey.Next}
    </button>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialSteps: ({ currentStep }: { currentStep: string }) => <div>Current step:{currentStep}</div>,
  };
});

describe('CreateTestSuite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTestSuiteByNameMock.mockResolvedValue({ content: [] });
  });

  test('enables the Target step after route selection and opens route-specific methods', async () => {
    const user = userEvent.setup();

    render(<CreateTestSuite isModalOpen onClose={vi.fn()} onCreate={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: ButtonsI18nKey.Next });
    await waitFor(() => expect(nextButton).toBeEnabled());
    expect(screen.getByText(`Current step:${TestSuitTab.Properties}`)).toBeTruthy();

    await user.click(nextButton);

    expect(await screen.findByText(`Current step:${TestSuitTab.Target}`)).toBeTruthy();
    expect(nextButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select route' }));
    await waitFor(() => expect(nextButton).toBeEnabled());
    await user.click(nextButton);

    expect(await screen.findByText('Route methods:search-route')).toBeTruthy();
    expect(screen.queryByText('Deployment methods')).toBeNull();
    expect(screen.queryByText('MCP tools')).toBeNull();
  });
});
