import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import EvaluatorVarsEditor from '@/src/components/Analytics/Evaluators/EvaluatorVarsEditor';
import { EVALUATOR_VAR_TYPES } from '@/src/constants/analytics/evaluators';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';

interface MockSelectProps {
  id: string;
  options: { value: string; label: string }[];
  value: string;
  disabled?: boolean;
}

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, options, value }: MockSelectProps) => (
      <div>{`${id} selected=${value || 'none'} options=${options.map((option) => option.value).join(',')}`}</div>
    ),
  };
});

const renderEditor = (vars: EvaluatorVar[]) =>
  render(<EvaluatorVarsEditor id="var" title="Output" vars={vars} hasExpression emptyText="none" onChange={vi.fn()} />);

describe('EvaluatorVarsEditor — the type control', () => {
  test('offers the catalog wire codes', () => {
    renderEditor([{ name: 'topic', type: 'string' }]);

    expect(screen.getByText(/var-type-0/)).toHaveTextContent(`options=${EVALUATOR_VAR_TYPES.join(',')}`);
  });

  test.each(['integer', 'timestamp', 'decimal', 'uuid'])('preselects a stored %s', (type) => {
    renderEditor([{ name: 'turn_bucket', type }]);

    expect(screen.getByText(/var-type-0/)).toHaveTextContent(`selected=${type}`);
  });

  test('keeps a stored alias selectable rather than blanking it', () => {
    renderEditor([{ name: 'activity_day', type: 'datetime' }]);

    const control = screen.getByText(/var-type-0/);
    expect(control).toHaveTextContent('selected=datetime');
    expect(control).toHaveTextContent('datetime');
  });

  test('states when nothing is declared', () => {
    render(
      <EvaluatorVarsEditor
        id="var"
        title="Input"
        vars={[]}
        emptyText={AnalyticsEvaluatorsI18nKey.NoInputVars}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NoInputVars)).toBeTruthy();
  });
});
