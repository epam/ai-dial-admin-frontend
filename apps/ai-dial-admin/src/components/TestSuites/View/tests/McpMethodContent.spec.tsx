import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import McpMethodContent from '../McpMethodContent';

vi.mock('@/src/components/TestSuites/ArgumentTemplate/ArgumentTemplate', () => ({
  default: () => <div>ArgumentTemplate</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal', () => ({
  default: () => <div>ChangeMcpToolModal</div>,
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/components/TryOutButton', () => ({
  default: () => <button type="button">TryOut</button>,
}));

vi.mock('@/src/components/TestSuites/View/McpToolSchema', () => ({
  default: () => <div>McpToolSchema</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ButtonAppearance: { Ghost: 'ghost' },
    DialPrimaryButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    ),
  };
});

vi.mock('@tabler/icons-react', () => ({
  IconEdit: () => <svg />,
}));

const baseMcpSuite: TestSuite = {
  id: 'suite-1',
  suiteType: SuiteType.McpTool,
  mcpDeploymentRef: { id: 'deploy-1', type: 'dial-toolset', name: 'My Toolset' },
  toolRef: {
    name: 'search',
    description: 'Search tool',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
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

    expect(screen.getByText('ArgumentTemplate')).toBeInTheDocument();
  });

  test('renders McpToolSchema', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.getByText('McpToolSchema')).toBeInTheDocument();
  });

  test('renders Change Tool button', () => {
    render(<McpMethodContent testSuite={baseMcpSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ChangeTool)).toBeInTheDocument();
  });
});
