import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createRule, getTable, getTables } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import CreateRulePopup from '@/src/components/Analytics/EnrichmentRules/CreateRulePopup';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({
      id,
      label,
      options,
      value,
      onChange,
      error,
    }: {
      id: string;
      label?: string;
      options: { value: string; label: string }[];
      value?: string;
      onChange?: (next: string) => void;
      error?: string;
    }) => (
      <div>
        <label>
          {label ?? id}
          <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
            <option value="">--</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {error && <span>{error}</span>}
      </div>
    ),
  };
});

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const evaluator: Evaluator = {
  name: 'feedback-rollup',
  version: 2,
  type: EvaluatorType.Sql,
  output_vars: [{ name: 'rate_event_count', type: 'long' }],
};

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

describe('CreateRulePopup', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  const renderPopup = (takenTargets: string[] = [], props?: Partial<Parameters<typeof CreateRulePopup>[0]>) =>
    render(
      <CreateRulePopup
        evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
        takenTargets={takenTargets}
        onClose={onClose}
        onCreated={onCreated}
        {...props}
      />,
    );

  const fillSubmittableRule = async (user: ReturnType<typeof userEvent.setup>) => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'my-rule' } });
    await selectEvaluator(user);
    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest));

    await waitFor(() => expect(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.BindingColumn)).toBeTruthy());
    await user.selectOptions(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.BindingColumn), 'rate_event_count');
    await user.selectOptions(
      screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.BindingVariable),
      'rate_event_count',
    );

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EnabledYes));
  };

  const selectEvaluator = async (user: ReturnType<typeof userEvent.setup>) =>
    user.selectOptions(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.Evaluator), 'feedback-rollup');

  const selectTarget = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() =>
      expect(
        screen
          .getByLabelText(AnalyticsEnrichmentRulesI18nKey.TargetEnrichment)
          .querySelector('option[value="turn_feedback"]'),
      ).toBeTruthy(),
    );
    return user.selectOptions(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.TargetEnrichment), 'turn_feedback');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment]);
    vi.mocked(getTable).mockResolvedValue(enrichment);
    vi.mocked(getEvaluator).mockResolvedValue(evaluator);
    vi.mocked(createRule).mockResolvedValue({ success: true });
  });

  test('renders the fields in the order the form specifies', () => {
    renderPopup();

    const order = [
      AnalyticsEnrichmentRulesI18nKey.Name,
      AnalyticsEnrichmentRulesI18nKey.Evaluator,
      AnalyticsEnrichmentRulesI18nKey.EvaluatorVersion,
      AnalyticsEnrichmentRulesI18nKey.TargetEnrichment,
      AnalyticsEnrichmentRulesI18nKey.TriggerKind,
      AnalyticsEnrichmentRulesI18nKey.OutputBindings,
      AnalyticsEnrichmentRulesI18nKey.Enabled,
    ];
    const rendered = document.body.textContent ?? '';
    const positions = order.map((key) => rendered.indexOf(key));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('discards its state when closed and reopened', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPopup();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'my-rule' } });
    await selectEvaluator(user);
    expect(screen.getByDisplayValue('my-rule')).toBeTruthy();

    unmount();
    renderPopup();

    expect(screen.queryByDisplayValue('my-rule')).toBeNull();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.OutputBindingsEmpty)).toBeTruthy();
  });

  test('offers both enabled options with their captions and preselects neither', () => {
    renderPopup();

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EnabledYes)).toBeTruthy();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EnabledNo)).toBeTruthy();
    screen.getAllByRole('radio', { name: /Enabled/ }).forEach((radio) => expect(radio).not.toBeChecked());
  });

  test('prompts for an evaluator and a target before the bindings editor is usable', () => {
    renderPopup();

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.OutputBindingsEmpty)).toBeTruthy();
  });

  // The operator can always open the modal; it is here that a missing evaluator is explained and
  // submission is blocked.
  test('states that no evaluator is registered and blocks submission', () => {
    renderPopup([], { evaluators: [] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.NoEvaluatorsNote)).toBeTruthy();
    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule })).toBeDisabled();
  });

  test('reports a failed evaluator listing rather than claiming none are registered', () => {
    renderPopup([], { evaluators: [], hasEvaluatorsError: true });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EvaluatorsLoadFailed)).toBeTruthy();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.NoEvaluatorsNote)).toBeNull();
  });

  test('blocks submission until the form is complete', () => {
    renderPopup();

    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule })).toBeDisabled();
  });

  test('states that no target remains when every enrichment already has a rule', async () => {
    renderPopup(['turn_feedback']);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.NoAvailableTargets)).toBeTruthy());
  });

  // readOnly rather than disabled: a disabled input leaves the accessibility tree, so the grain key the
  // spec requires be presented would be unreadable to a screen reader and uncopyable by keyboard.
  test('derives a read-only group-by from the target grain key', async () => {
    const user = userEvent.setup();
    renderPopup();

    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerGroup));

    await waitFor(() => expect(screen.getByDisplayValue('response_id')).toBeTruthy());
    expect(screen.getByDisplayValue('response_id')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('response_id')).toBeEnabled();
  });

  test('requires a readiness condition for a group rule', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerGroup));

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.ReadyWhenRequired)).toBeTruthy();
  });

  test('warns that a sql evaluator needs an output binding', async () => {
    const user = userEvent.setup();
    renderPopup();

    await selectEvaluator(user);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.OutputBindingsRequired)).toBeTruthy());
  });

  test('warns that an llm rule without bindings discards its results', async () => {
    vi.mocked(getEvaluator).mockResolvedValue({ ...evaluator, type: EvaluatorType.Llm });
    const user = userEvent.setup();
    renderPopup();

    await selectEvaluator(user);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.OutputBindingsDiscarded)).toBeTruthy());
  });

  test('submits the assembled rule and closes on success', async () => {
    const user = userEvent.setup();
    renderPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule }));

    await waitFor(() =>
      expect(createRule).toHaveBeenCalledWith({
        name: 'my-rule',
        evaluator_name: 'feedback-rollup',
        target_enrichment: 'turn_feedback',
        trigger_kind: TriggerKind.OnIngest,
        enabled: true,
        output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
      }),
    );
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('keeps the popup open and shows the service message when creation is rejected', async () => {
    vi.mocked(createRule).mockResolvedValue({
      success: false,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'group_by must equal the grain key',
    });
    const user = userEvent.setup();
    renderPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule }));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'rule_validation_failed',
          description: 'group_by must equal the grain key',
        }),
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('my-rule')).toBeTruthy();
  });

  // The exclusion set is computed from a listing that can be stale by submit time, so the 409 path has
  // to work even though a bound target is never offered.
  test('surfaces a racing 409 without discarding the entered values', async () => {
    vi.mocked(createRule).mockResolvedValue({
      success: false,
      status: 409,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'an enrichment admits at most one rule',
    });
    const user = userEvent.setup();
    renderPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(screen.getByDisplayValue('my-rule')).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test('does not submit while an evaluator resolution has failed', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const user = userEvent.setup();
    renderPopup();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'my-rule' } });
    await selectEvaluator(user);
    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EnabledYes));

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EvaluatorLoadFailed)).toBeTruthy());
    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.CreateRule })).toBeDisabled();
  });

  test('reports a failed evaluator resolution in the form', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const user = userEvent.setup();
    renderPopup();

    await selectEvaluator(user);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.EvaluatorLoadFailed)).toBeTruthy());
  });
});
