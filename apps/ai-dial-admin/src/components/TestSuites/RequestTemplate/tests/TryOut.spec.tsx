import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import TryOut from '../components/TryOut';
import { getTryoutResponseFromStorage } from '../../utils/tryout-storage';

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

vi.mock('@/src/components/TestSuites/utils/tryout-storage', () => ({
  saveTryoutResponseToStorage: vi.fn(),
  getTryoutResponseFromStorage: vi.fn(),
}));

vi.mock('@/src/components/TestSuites/utils/template-variables', () => ({
  convertVariableIntoInitialRequest: vi.fn(() => ({})),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>JsonEditor</div>,
}));

vi.mock('../components/Variables', () => ({
  default: () => <div>Variables</div>,
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
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
    AlertVariant: { Success: 'success', Error: 'error' },
    DialAlert: ({ message, variant }: { message: string; variant: string }) => <div>{message}</div>,
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
});
