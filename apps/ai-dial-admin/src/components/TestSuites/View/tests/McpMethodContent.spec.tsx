import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import McpMethodContent from '../McpMethodContent';

vi.mock('@/src/components/TestSuites/ArgumentTemplate/ArgumentTemplate', () => ({
  default: () => <div data-testid="argument-template">ArgumentTemplate</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal', () => ({
  default: () => <div data-testid="change-tool-modal">ChangeMcpToolModal</div>,
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/components/TryOutButton', () => ({
  default: () => <button type="button">TryOut</button>,
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div data-testid="json-editor">{JSON.stringify(entity)}</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  ButtonAppearance: { Ghost: 'ghost' },
  DialPrimaryButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconEdit: () => <svg />,
}));

const baseMcpSuite: TestSuite = {
  id: 'suite-1',
  suiteType: 'MCP_TOOL',
  mcpDeploymentRef: { id: 'deploy-1', type: 'dial-toolset', name: 'My Toolset' },
  toolRef: {
    name: 'search',
    description: 'Search tool',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
};

describe('McpMethodContent', () => {
  test('renders tool call header with deployment and tool names', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.getByText('My Toolset')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
  });

  test('renders ArgumentTemplate', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.getByTestId('argument-template')).toBeInTheDocument();
  });

  test('hides output schema when absent', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.queryByText(TestSuitesI18nKey.ToolOutputSchema)).not.toBeInTheDocument();
  });

  test('shows output schema when present', () => {
    const suiteWithOutput: TestSuite = {
      ...baseMcpSuite,
      toolRef: {
        ...baseMcpSuite.toolRef!,
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
      },
    };

    render(<McpMethodContent testSuite={suiteWithOutput} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ToolOutputSchema)).toBeInTheDocument();
    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
  });

  test('renders Change Toolset / Tool button', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ChangeTool)).toBeInTheDocument();
  });
});
