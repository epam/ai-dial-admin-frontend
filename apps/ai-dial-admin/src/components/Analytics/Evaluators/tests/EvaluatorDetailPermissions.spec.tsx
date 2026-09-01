import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import { AnalyticsEvaluatorsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { Evaluator, EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';

vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div>grid</div> }));

// test-setup.tsx pins isFullAdmin true for the whole suite, so the non-admin case needs its own file.
const isFullAdmin = { value: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ isFullAdmin: isFullAdmin.value, isReadOnlyAdmin: !isFullAdmin.value, isEnableAuth: true }),
}));

const evaluator: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  preset: EvaluatorPreset.ChatCompletion,
  model: 'gemini-2.5-flash-lite',
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'topic' }],
};

const renderView = () =>
  render(
    <EvaluatorDetailView
      evaluator={evaluator}
      summary={{ name: evaluator.name, latest_version: 4 }}
      referencingRules={[]}
    />,
  );

describe('EvaluatorDetailView — a caller without full-admin rights', () => {
  test('still reaches both tabs and reads every field', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.getByText(TabsI18nKey.Properties)).toBeTruthy();
    expect(screen.getByText(TabsI18nKey.Rules)).toBeTruthy();
    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model)).toHaveValue('gemini-2.5-flash-lite');
  });

  test('is still offered the JSON editor toggle', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.JSONEditor)).toBeInTheDocument();
  });

  test('cannot edit the fields', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model)).toBeDisabled();
  });

  test('cannot add a variable', () => {
    isFullAdmin.value = false;
    renderView();

    // Disabled rather than hidden: the spec keeps the whole surface visible and inert. Both the input and
    // the output editors carry one, and neither may be usable.
    const addButtons = screen.getAllByRole('button', { name: AnalyticsEvaluatorsI18nKey.AddVariable });
    expect(addButtons).toHaveLength(2);
    addButtons.forEach((button) => expect(button).toBeDisabled());
  });

  test('is offered no save', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.queryByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeNull();
  });

  test('a full admin can edit the same field', () => {
    isFullAdmin.value = true;
    renderView();

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model)).not.toBeDisabled();
  });
});
