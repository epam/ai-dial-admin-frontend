import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import MetricCard from '../MetricCard';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
  DialGhostButton: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  ElementSize: { Standard: 'standard' },
}));

vi.mock('@/src/components/Common/ContentWithLinks/ContentWithLinks', () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('../MetricCardDescription', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('MetricCard', () => {
  const metric: Metric = {
    id: 'metric-1',
    name: 'RAG Retrieval',
    description: 'Evaluates RAG retrieval',
    condition: 'Always custom',
    configBindings: [{ property: 'matcher', source: { $type: MetricBindingType.Constant, value: 'NLP' } }],
    inputBindings: [{ property: 'facts', source: { $type: MetricBindingType.Constant, value: 'a, b' } }],
    outputSchema: {
      type: 'object',
      properties: {
        F1: { type: 'number' },
        Recall: { type: 'number' },
      },
    },
  };

  test('renders name, description, condition, bindings, and outputs', () => {
    render(<MetricCard metric={metric} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('article', { name: 'RAG Retrieval' })).toBeInTheDocument();
    expect(screen.getAllByText('RAG Retrieval').length).toBeGreaterThan(0);
    expect(screen.getByText('Evaluates RAG retrieval')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Condition)).toBeInTheDocument();
    expect(screen.getByText('Always custom')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Configuration)).toBeInTheDocument();
    expect(screen.getByText(/matcher:\s*NLP/)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Outputs)).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('Recall')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Inputs)).toBeInTheDocument();
    expect(screen.getByText(/facts:\s*a, b/)).toBeInTheDocument();
  });

  test('omits Configuration, Outputs, and Inputs rows when empty', () => {
    render(
      <MetricCard
        metric={{ id: 'm2', name: 'Bare', condition: undefined, description: undefined }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.ConditionAlwaysRun)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Configuration)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Outputs)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Inputs)).not.toBeInTheDocument();
  });

  test('renders a full-width tag for long input binding values', () => {
    const longValue = 'Prompt: '.concat('x'.repeat(100));

    render(
      <MetricCard
        metric={{
          ...metric,
          configBindings: undefined,
          outputSchema: undefined,
          inputBindings: [{ property: 'prompt', source: { $type: MetricBindingType.Constant, value: longValue } }],
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const tag = screen.getByText(new RegExp(`prompt:\\s*${longValue}`));
    expect(tag).toHaveClass('w-full');
    expect(tag).toHaveClass('whitespace-pre-wrap');
  });

  test('invokes onEdit and onDelete from header actions', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<MetricCard metric={metric} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
