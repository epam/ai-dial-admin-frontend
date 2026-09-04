import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Methods from '../Methods';

const mockGetDeployment = vi.fn();
const mockGenerateMethodPathCombinations = vi.fn();

vi.mock('@/src/components/TestSuites/utils/method', () => ({
  generateMethodPathCombinations: (...args: any[]) => mockGenerateMethodPathCombinations(...args),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployment: (...args: any[]) => mockGetDeployment(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children }: any) => <div role="complementary">{children}</div>,
  DialConditionalResizableContainer: ({ children }: any) => <div>{children}</div>,
  DialLoader: () => <div role="progressbar" />,
}));

vi.mock('../MethodItem', () => ({
  __esModule: true,
  default: ({ item, index, onClick, isActive, label }: any) => (
    <div className={isActive ? 'active-method' : 'inactive-method'} data-index={index}>
      <button onClick={() => onClick(index)} aria-current={isActive}>
        {item?.method} {label ?? item?.relativeUrlPattern ?? ''}
      </button>
    </div>
  ),
}));

vi.mock('../MethodInfo', () => ({
  __esModule: true,
  default: ({ testSuite }: any) => (
    <div role="region" aria-label="method-info">
      {testSuite?.endpointRef?.method}
    </div>
  ),
}));

describe('Methods component', () => {
  const onChange = vi.fn();
  const mockDeployment = {
    deploymentId: 'test-deployment',
    $type: 'application',
    routes: {
      'route-1': { path: '/api/users', methods: ['GET', 'POST'] },
      'route-2': { path: '/api/data', methods: ['GET'] },
    },
  };

  const mockMethods = [
    { method: 'GET', relativeUrlPattern: '/api/users' },
    { method: 'POST', relativeUrlPattern: '/api/users' },
    { method: 'GET', relativeUrlPattern: '/api/data' },
  ];

  beforeEach(() => {
    onChange.mockClear();
    mockGetDeployment.mockClear();
    mockGenerateMethodPathCombinations.mockClear();
    mockGetDeployment.mockResolvedValue(mockDeployment);
    mockGenerateMethodPathCombinations.mockReturnValue(mockMethods);
  });

  test('renders chat-completion method as first item', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
    });
  });

  test('fetches deployment and generates methods on mount', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(mockGetDeployment).toHaveBeenCalledWith('test-deployment', 'application');
      expect(mockGenerateMethodPathCombinations).toHaveBeenCalledWith(mockDeployment.routes);
    });
  });

  test('renders all generated methods after chat-completion', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'GET /api/users' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'GET /api/data' })).toBeInTheDocument();
    });
  });

  test('sets active method based on existing endpointRef on mount', async () => {
    const testSuite: any = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/api/users' },
    };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
  });

  test('defaults to chat-completion when endpointRef does not match any method', async () => {
    const testSuite: any = {
      endpointRef: { method: 'DELETE', relativeUrlPattern: '/not-found' },
    };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
  });

  test('does not fetch deployment if already loaded', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    const { rerender } = render(
      <Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />,
    );

    await waitFor(() => {
      expect(mockGetDeployment).toHaveBeenCalledTimes(1);
    });

    rerender(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    expect(mockGetDeployment).toHaveBeenCalledTimes(1);
  });

  test('keeps the default chat-completion column name when it is not taken', async () => {
    const user = userEvent.setup();
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: 'POST /chat/completions' }));

    const updater = onChange.mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe('function');
    expect(updater({}).responseColumns[0]).toEqual(expect.objectContaining({ name: 'answer', displayName: 'answer' }));
  });

  test('highlights chat-completion without resetting the template when it is already selected', async () => {
    const user = userEvent.setup();
    const testSuite: any = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      requestTemplate: {
        body: { content: { messages: [{ role: 'user', content: '${{user_message22222222222222222}}' }] } },
      },
    };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: 'POST /chat/completions' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('uniquifies the default chat-completion column name against taken names', async () => {
    const user = userEvent.setup();
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(
      <Methods
        testSuite={testSuite}
        selectedTarget={selectedApplication}
        onChange={onChange}
        takenColumnNames={['answer', 'history']}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'POST /chat/completions' }));

    const updater = onChange.mock.calls.at(-1)?.[0];
    expect(updater({}).responseColumns[0]).toEqual(
      expect.objectContaining({ name: 'answer2', displayName: 'answer2' }),
    );
  });

  describe('Responses group', () => {
    const selectedApplication: any = { deploymentId: 'gpt-4o', $type: 'dial-model' };

    const renderWithInterfaces = (interfaces?: string[], testSuite: any = { endpointRef: {} }) => {
      mockGetDeployment.mockResolvedValue({ ...mockDeployment, deploymentId: 'gpt-4o', interfaces });

      return render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);
    };

    test('is absent when the deployment reports no interfaces', async () => {
      renderWithInterfaces();

      await screen.findByRole('button', { name: 'POST /chat/completions' });
      expect(screen.queryByRole('group', { name: 'TestSuites.Responses' })).not.toBeInTheDocument();
    });

    test('is absent when the reported interfaces omit openaiResponses', async () => {
      renderWithInterfaces(['chat', 'openaiChatCompletions']);

      await screen.findByRole('button', { name: 'POST /chat/completions' });
      expect(screen.queryByRole('group', { name: 'TestSuites.Responses' })).not.toBeInTheDocument();
    });

    test('renders the four operations when openaiResponses is reported', async () => {
      renderWithInterfaces(['chat', 'openaiResponses']);

      expect(await screen.findByRole('group', { name: 'TestSuites.Responses' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'POST /openai/v1/responses' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'POST /openai/v1/responses/{response_id}/cancel' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'GET /openai/v1/responses/{response_id}' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'DELETE /openai/v1/responses/{response_id}' })).toBeInTheDocument();
    });

    test('renders groups in order: chat interface, responses, other', async () => {
      renderWithInterfaces(['openaiResponses']);

      await screen.findByRole('group', { name: 'TestSuites.Responses' });
      const groupNames = screen
        .getAllByRole('group')
        .map((group) => group.getAttribute('aria-labelledby'))
        .map((id) => document.getElementById(id ?? '')?.textContent);

      expect(groupNames).toEqual(['TestSuites.ChatInterface', 'TestSuites.Responses', 'TestSuites.Other']);
    });

    test('renders from features.responses_api when Core reports no interfaces', async () => {
      // Shape observed on the wire for a Responses-capable model: Core omits `interfaces` and
      // reports support through the passed-through `features` flag instead.
      mockGetDeployment.mockResolvedValue({
        ...mockDeployment,
        deploymentId: 'deepseek-ocr-2',
        interfaces: undefined,
        features: { chat_completion: true, responses_api: true },
      });

      render(
        <Methods testSuite={{ endpointRef: {} } as any} selectedTarget={selectedApplication} onChange={onChange} />,
      );

      expect(await screen.findByRole('group', { name: 'TestSuites.Responses' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'POST /openai/v1/responses' })).toBeInTheDocument();
    });

    test('is absent when features reports responses_api false', async () => {
      mockGetDeployment.mockResolvedValue({
        ...mockDeployment,
        features: { chat_completion: true, responses_api: false },
      });

      render(
        <Methods testSuite={{ endpointRef: {} } as any} selectedTarget={selectedApplication} onChange={onChange} />,
      );

      await screen.findByRole('button', { name: 'POST /chat/completions' });
      expect(screen.queryByRole('group', { name: 'TestSuites.Responses' })).not.toBeInTheDocument();
    });

    test('stays visible for a suite already selecting a Responses method', async () => {
      renderWithInterfaces(undefined, {
        endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      });

      expect(await screen.findByRole('group', { name: 'TestSuites.Responses' })).toBeInTheDocument();
    });

    test('marks the saved Responses method as current', async () => {
      renderWithInterfaces(['openaiResponses'], {
        endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses/[^/]+/cancel' },
      });

      const cancel = await screen.findByRole('button', {
        name: 'POST /openai/v1/responses/{response_id}/cancel',
      });

      expect(cancel).toHaveAttribute('aria-current', 'true');
      expect(screen.getByRole('button', { name: 'POST /chat/completions' })).toHaveAttribute('aria-current', 'false');
    });

    test('seeds the create-response suite with the target deployment id', async () => {
      const user = userEvent.setup();
      renderWithInterfaces(['openaiResponses']);

      await user.click(await screen.findByRole('button', { name: 'POST /openai/v1/responses' }));

      const updater = onChange.mock.calls.at(-1)?.[0];
      expect(updater({}).requestTemplate.body.content).toEqual({ model: 'gpt-4o', input: '${{user_message}}' });
      expect(updater({}).responseColumns[0]).toEqual(expect.objectContaining({ name: 'answer' }));
    });

    test('seeds a response-scoped operation with a placeholder path and clears the previous columns', async () => {
      const user = userEvent.setup();
      renderWithInterfaces(['openaiResponses']);

      await user.click(await screen.findByRole('button', { name: 'GET /openai/v1/responses/{response_id}' }));

      const previous: any = {
        responseColumns: [{ name: 'answer', displayName: 'answer', expression: 'choices[0].message.content' }],
      };
      const updater = onChange.mock.calls.at(-1)?.[0];
      expect(updater(previous).requestTemplate.urlTemplate).toBe('/openai/v1/responses/${{response_id}}');
      expect(updater(previous).requestTemplate.body.content).toEqual({});
      expect(updater(previous).responseColumns).toEqual([]);
    });
  });
});
