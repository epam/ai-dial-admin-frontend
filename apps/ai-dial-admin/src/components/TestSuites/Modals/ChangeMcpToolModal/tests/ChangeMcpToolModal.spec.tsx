import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ToolDefinition } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import ChangeMcpToolModal from '../ChangeMcpToolModal';

// Mock the tool picker so we can observe the `selectedToolName` it receives
// (the value that drives the radio's checked state) and trigger a selection.
const CALCULATOR_TOOL: ToolDefinition = {
  name: 'calculator',
  description: 'Calculator tool',
  inputSchema: { type: 'object', properties: {} },
};

vi.mock('@/src/components/TestSuites/Modals/Create/McpTool', () => ({
  default: ({
    selectedToolName,
    onSelect,
  }: {
    selectedToolName?: string;
    onSelect: (tool: ToolDefinition) => void;
  }) => (
    <div>
      <span>selected:{selectedToolName ?? 'none'}</span>
      <button type="button" onClick={() => onSelect(CALCULATOR_TOOL)}>
        pick-calculator
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/TestSuites/ArgumentTemplate/utils', () => ({
  buildInitialArguments: () => ({}),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    PopupSize: { Lg: 'lg' },
    DialConfirmationPopup: ({
      children,
      confirmLabel,
      onConfirm,
      disableConfirmButton,
      open,
    }: {
      children: React.ReactNode;
      confirmLabel: string;
      onConfirm: () => void;
      disableConfirmButton?: boolean;
      open?: boolean;
    }) =>
      open ? (
        <div>
          {children}
          <button type="button" onClick={onConfirm} disabled={disableConfirmButton}>
            {confirmLabel}
          </button>
        </div>
      ) : null,
  };
});

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

describe('ChangeMcpToolModal', () => {
  test('pre-selects the saved tool when opened', () => {
    render(<ChangeMcpToolModal testSuite={baseMcpSuite} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('selected:search')).toBeInTheDocument();
  });

  test('moves the selection to the tool the user picks', async () => {
    const user = userEvent.setup();
    render(<ChangeMcpToolModal testSuite={baseMcpSuite} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'pick-calculator' }));

    expect(screen.getByText('selected:calculator')).toBeInTheDocument();
    expect(screen.queryByText('selected:search')).not.toBeInTheDocument();
  });

  test('saves the test suite with the picked tool', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ChangeMcpToolModal testSuite={baseMcpSuite} isOpen onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'pick-calculator' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].toolRef).toEqual(
      expect.objectContaining({ name: 'calculator', description: 'Calculator tool' }),
    );
  });

  test('disables Save until a tool is picked', async () => {
    const user = userEvent.setup();
    render(<ChangeMcpToolModal testSuite={baseMcpSuite} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'pick-calculator' }));

    expect(saveButton).toBeEnabled();
  });
});
