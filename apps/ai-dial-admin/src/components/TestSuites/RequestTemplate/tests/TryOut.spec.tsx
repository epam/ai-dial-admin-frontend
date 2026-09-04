import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { getTestCaseTemplateVariables, tryOutTestCase, tryOutTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { convertVariableIntoInitialRequest } from '@/src/components/TestSuites/utils/template-variables';
import { ButtonsI18nKey, TabsI18nKey, TestSuitesI18nKey, ValidityStatusI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestCase, TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { getTryoutResponseFromStorage } from '@/src/components/TestSuites/utils/tryout-storage';
import TryOut from '../components/TryOut';

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteTemplateVariables: vi.fn(() => Promise.resolve([])),
  getTestCaseTemplateVariables: vi.fn(() => Promise.resolve([])),
  tryOutTestSuite: vi.fn(() =>
    Promise.resolve({
      success: true,
      response: {
        resolvedRequest: {},
        response: { statusCode: 200, body: 'ok' },
      },
    }),
  ),
  tryOutTestCase: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetTestCase: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/src/components/TestSuites/utils/tryout-storage', () => ({
  saveTryoutResponseToStorage: vi.fn(),
  getTryoutResponseFromStorage: vi.fn(() => ({
    resolvedRequest: { foo: 'bar' },
    response: null,
  })),
}));

vi.mock('@/src/components/TestSuites/utils/template-variables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/components/TestSuites/utils/template-variables')>();
  return {
    ...actual,
    convertVariableIntoInitialRequest: vi.fn(() => ({})),
  };
});

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div>JsonEditor:{JSON.stringify(entity)}</div>,
}));

vi.mock('../components/Variables', () => ({
  default: () => <div>Variables</div>,
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    NotificationVariant: { Success: 'success', Error: 'error' },
    DialNotification: ({ message, variant }: { message: string; variant: string }) => <div>{message}</div>,
    DialCloseButton: ({ onClose }: { onClose: () => void }) => (
      <button type="button" onClick={onClose}>
        Close
      </button>
    ),
    DialGhostButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
    DialLoader: () => <div>Loading...</div>,
    DialNeutralButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    ),
    DialPrimaryButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    ),
    ElementSize: { Small: 'small' },
  };
});

vi.mock('@tabler/icons-react', () => ({
  IconRefresh: () => <svg />,
  IconEqual: () => <svg />,
  IconEqualNot: () => <svg />,
  IconEdit: () => <svg />,
}));

vi.mock('@/public/images/icons/grafana.svg', () => ({
  default: () => <svg />,
}));

const mockCloseSidebar = vi.fn();
const mockToggleSidebar = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      closeSidebar: mockCloseSidebar,
      showSidebar: vi.fn(),
      toggleIsMenuClosed: vi.fn(),
      isMenuClosed: false,
    },
    sidebarOpen: false,
    toggleSidebar: mockToggleSidebar,
  }),
}));

const mcpSuite: TestSuite = {
  id: 'suite-mcp',
  suiteType: SuiteType.McpTool,
  mcpDeploymentRef: { id: 'deploy-1', type: 'dial-toolset', name: 'My Toolset' },
  toolRef: {
    name: 'search',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
};

const deploymentSuite: TestSuite = {
  id: 'suite-dep',
  suiteType: SuiteType.Deployment,
  endpointRef: { method: 'POST', relativeUrlPattern: '/api/search' },
};

const mcpSuiteWithRequestColumn: TestSuite = {
  ...mcpSuite,
  responseColumns: [{ name: 'reqFoo', displayName: 'reqFoo', expression: '$request.foo', type: 'STRING' }],
};

const deploymentSuiteWithAnswerColumn: TestSuite = {
  ...deploymentSuite,
  responseColumns: [{ name: 'answer', displayName: 'answer', expression: 'output', type: 'STRING' }],
};

const multiRequestSchema: TestCaseSchema[] = [
  { name: 'shared', type: TestCaseItemType.STRING, required: false, description: '', perTurn: false },
];

const multiRequestSuite: TestSuite = {
  id: 'suite-mr',
  suiteType: SuiteType.Deployment,
  endpointRef: { method: 'POST', relativeUrlPattern: '/api/chat' },
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }] }],
};

const multiRequestCase: TestCase = {
  id: 'case-mr',
  createdAt: 0,
  data: { shared: 'value' },
};

describe('TryOut MCP branch', () => {
  test('shows Tool Arguments Preview label for MCP suite', async () => {
    render(<TryOut testSuite={mcpSuite} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.ToolArgumentsPreview)).toBeInTheDocument();
    });
  });

  test('shows TOOL CALL line for MCP suite', async () => {
    render(<TryOut testSuite={mcpSuite} />);

    await waitFor(() => {
      expect(screen.getByText('TOOL CALL My Toolset:search')).toBeInTheDocument();
    });
  });

  test('shows Request Body Preview label for DEPLOYMENT suite', async () => {
    render(<TryOut testSuite={deploymentSuite} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.RequestBodyPreview)).toBeInTheDocument();
    });
  });

  test('shows method/URL line for DEPLOYMENT suite', async () => {
    render(<TryOut testSuite={deploymentSuite} />);

    await waitFor(() => {
      expect(screen.getByText('POST /api/search')).toBeInTheDocument();
    });
  });

  test('wraps the bare request body into a request envelope on a failed send', async () => {
    vi.mocked(convertVariableIntoInitialRequest).mockReturnValueOnce({ foo: 'bar' });
    vi.mocked(tryOutTestSuite).mockResolvedValueOnce({ success: false, errorMessage: 'boom' });

    const user = userEvent.setup();
    render(<TryOut testSuite={deploymentSuite} />);

    const sendButton = await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('JsonEditor:{"foo":"bar"}')).toBeInTheDocument();
    });
  });
});

describe('TryOut Columns tab request binding', () => {
  test('hides Response and Columns tabs until a request has been sent', async () => {
    render(<TryOut testSuite={deploymentSuite} />);

    await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest });

    expect(screen.queryByRole('tab', { name: TabsI18nKey.Response })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: TabsI18nKey.Columns })).not.toBeInTheDocument();
  });

  // Client-side evaluation survives only for MCP, so this binding guard now belongs to an MCP suite.
  test('binds $request to the request body, not the request envelope, for an MCP suite', async () => {
    vi.mocked(tryOutTestSuite).mockResolvedValueOnce({
      success: true,
      response: {
        resolvedRequest: { url: '/v1/chat', method: 'POST', body: { foo: 'bar' } },
        response: { statusCode: 200, body: { ok: true } },
      },
    });

    const user = userEvent.setup();
    render(<TryOut testSuite={mcpSuiteWithRequestColumn} />);

    const sendButton = await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest });
    await user.click(sendButton);

    const columnsTab = await screen.findByRole('tab', { name: TabsI18nKey.Columns });
    await user.click(columnsTab);

    await waitFor(() => {
      expect(screen.getByText('bar')).toBeInTheDocument();
    });
  });

  test("renders the backend's reported extraction for a deployment suite", async () => {
    vi.mocked(tryOutTestSuite).mockResolvedValueOnce({
      success: true,
      response: {
        resolvedRequest: { url: '/openai/v1/responses', body: {} },
        response: { statusCode: 200, body: { events: [] } },
        extractedColumns: { answer: 'Hi there, friend!' },
        extractionWarnings: [],
      },
    });

    const user = userEvent.setup();
    render(<TryOut testSuite={deploymentSuiteWithAnswerColumn} />);

    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest }));
    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Columns }));

    await waitFor(() => {
      expect(screen.getByText('Hi there, friend!')).toBeInTheDocument();
    });
    expect(screen.getByText(ValidityStatusI18nKey.Valid)).toBeInTheDocument();
  });

  test('reports not extracted when the invocation failed', async () => {
    vi.mocked(tryOutTestSuite).mockResolvedValueOnce({
      success: true,
      response: {
        resolvedRequest: { url: '/openai/v1/responses', body: {} },
        response: { statusCode: 401, body: 'At least API-KEY or Authorization header must be provided' },
      },
    });

    const user = userEvent.setup();
    render(<TryOut testSuite={deploymentSuiteWithAnswerColumn} />);

    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest }));
    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Columns }));

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.ColumnNotExtracted)).toBeInTheDocument();
    });
    expect(screen.getByText(TestSuitesI18nKey.ColumnNotExtractedRequestFailed)).toBeInTheDocument();
    expect(screen.queryByText(ValidityStatusI18nKey.Invalid)).not.toBeInTheDocument();
  });

  test('a restored result shows the same extraction as the original', async () => {
    vi.mocked(getTryoutResponseFromStorage).mockReturnValueOnce({
      resolvedRequest: { url: '/openai/v1/responses', body: {} },
      response: { statusCode: 200, body: { events: [] } },
      extractedColumns: { answer: 'Hi there, friend!' },
      extractionWarnings: [],
    });

    const user = userEvent.setup();
    render(<TryOut testSuite={deploymentSuiteWithAnswerColumn} />);

    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Columns }));

    await waitFor(() => {
      expect(screen.getByText('Hi there, friend!')).toBeInTheDocument();
    });
  });

  test('a restored result recorded before extraction was captured reports not extracted', async () => {
    vi.mocked(getTryoutResponseFromStorage).mockReturnValueOnce({
      resolvedRequest: { url: '/openai/v1/responses', body: {} },
      response: { statusCode: 200, body: { events: [] } },
    });

    const user = userEvent.setup();
    render(<TryOut testSuite={deploymentSuiteWithAnswerColumn} />);

    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Columns }));

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.ColumnNotExtractedNoneReported)).toBeInTheDocument();
    });
  });
});

describe('TryOut request tabs', () => {
  test('hides request tabs while preview variables are loading', async () => {
    let resolveVariables: (value: unknown[]) => void = () => undefined;
    vi.mocked(getTestCaseTemplateVariables).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveVariables = resolve;
        }),
    );

    render(
      <TryOut
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={multiRequestSchema}
        initialTestCase={multiRequestCase}
      />,
    );

    expect(screen.queryByRole('tab', { name: '1. TestSuites.Request' })).not.toBeInTheDocument();

    resolveVariables([]);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '1. TestSuites.Request' })).toBeInTheDocument();
    });
  });

  test('shows request tabs for multi-request test case preview', async () => {
    render(
      <TryOut
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={multiRequestSchema}
        initialTestCase={multiRequestCase}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '1. TestSuites.Request' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: '2. TestSuites.Request' })).toBeInTheDocument();
  });

  test('hides request tabs while sending a test case request', async () => {
    let resolveTryOut:
      | ((value: {
          success: boolean;
          response: {
            resolvedRequest: { body: Record<string, unknown> };
            response: { statusCode: number; body: Record<string, unknown> };
            history: TryOutHistoryEntry[];
          };
        }) => void)
      | undefined;
    vi.mocked(tryOutTestCase).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveTryOut = resolve;
        }),
    );

    const user = userEvent.setup();
    render(
      <TryOut
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={multiRequestSchema}
        initialTestCase={multiRequestCase}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '1. TestSuites.Request' })).toBeInTheDocument();
    });

    const sendButton = await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest });
    await user.click(sendButton);

    expect(screen.queryByRole('tab', { name: '1. TestSuites.Request' })).not.toBeInTheDocument();

    resolveTryOut?.({
      success: true,
      response: {
        resolvedRequest: { body: {} },
        response: { statusCode: 200, body: {} },
        history: [
          { resolvedRequest: { body: { req: 1 } }, response: { statusCode: 200, body: { out: 'a' } } },
          { resolvedRequest: { body: { req: 2 } }, response: { statusCode: 200, body: { out: 'b' } } },
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '1. TestSuites.Request' })).toBeInTheDocument();
    });
  });

  test('switches response content when selecting another request tab', async () => {
    vi.mocked(tryOutTestCase).mockResolvedValueOnce({
      success: true,
      response: {
        resolvedRequest: { body: {} },
        response: { statusCode: 200, body: {} },
        history: [
          { resolvedRequest: { body: { req: 1 } }, response: { statusCode: 200, body: { out: 'a' } } },
          { resolvedRequest: { body: { req: 2 } }, response: { statusCode: 200, body: { out: 'b' } } },
        ],
      },
    });

    const user = userEvent.setup();
    render(
      <TryOut
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={multiRequestSchema}
        initialTestCase={multiRequestCase}
      />,
    );

    const sendButton = await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('JsonEditor:{"req":1}')).toBeInTheDocument();
    });
    expect(screen.queryByText('JsonEditor:{"req":2}')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '2. TestSuites.Request' }));

    await waitFor(() => {
      expect(screen.getByText('JsonEditor:{"req":2}')).toBeInTheDocument();
    });
    expect(screen.queryByText('JsonEditor:{"req":1}')).not.toBeInTheDocument();
  });
});
