import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createPipeline, getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import CreatePipelinePopup from '@/src/components/Analytics/Pipelines/CreatePipelinePopup';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { TriggerKind, PipelineKind, TransformType } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');

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

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

describe('CreatePipelinePopup', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  const renderPopup = (takenTargets: string[] = [], props?: Partial<Parameters<typeof CreatePipelinePopup>[0]>) =>
    render(
      <CreatePipelinePopup
        functions={[]}
        takenTargets={takenTargets}
        onClose={onClose}
        onCreated={onCreated}
        {...props}
      />,
    );

  const renderEnrichPopup = renderPopup;

  const fillSubmittableRule = async (user: ReturnType<typeof userEvent.setup>) => {
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'my-rule' } });
    await selectTarget(user);
    await declareSqlOutput(user);
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.TriggerOnIngest));
  };

  // A transform is registered with its type and at least one output; the sql type needs no model. The
  // column is bound while the type is still llm, whose row labels its own select.
  const declareSqlOutput = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.AddOutput));
    await user.selectOptions(
      screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, { exact: false, selector: 'select' }),
      'rate_event_count',
    );
    await user.selectOptions(screen.getByLabelText(AnalyticsPipelinesI18nKey.TransformType), TransformType.Sql);
    const expression = screen.getByLabelText(`${AnalyticsPipelinesI18nKey.VarExpression} 1`, { exact: false });
    fireEvent.change(expression, { target: { value: 'count(*)' } });
  };

  const selectTarget = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() =>
      expect(
        screen.getByLabelText(AnalyticsPipelinesI18nKey.Target).querySelector('option[value="turn_feedback"]'),
      ).toBeTruthy(),
    );
    return user.selectOptions(screen.getByLabelText(AnalyticsPipelinesI18nKey.Target), 'turn_feedback');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment]);
    vi.mocked(getTable).mockResolvedValue(enrichment);
    vi.mocked(createPipeline).mockResolvedValue({ success: true });
  });

  test('renders the fields in the order the form specifies', () => {
    renderEnrichPopup();

    const order = [
      AnalyticsPipelinesI18nKey.Name,
      AnalyticsPipelinesI18nKey.Kind,
      AnalyticsPipelinesI18nKey.Target,
      AnalyticsPipelinesI18nKey.SectionTransform,
      AnalyticsPipelinesI18nKey.TriggerKind,
    ];
    const rendered = document.body.textContent ?? '';
    const positions = order.map((key) => rendered.indexOf(key));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('leaves the optional transform members to the detail page', () => {
    renderEnrichPopup();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SectionParams)).toBeNull();
  });

  // The service refuses an llm transform with no template on every write, so registration collects it
  // even though the placeholder correspondence is only checked at enable.
  test('collects the request template an llm transform requires', () => {
    renderEnrichPopup();

    expect(screen.getByText(AnalyticsPipelinesI18nKey.SectionRequestTemplate)).toBeTruthy();
  });

  test('blocks submission while an llm transform carries no template', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'my-rule' } });
    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.AddOutput));
    await user.selectOptions(
      screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, { exact: false, selector: 'select' }),
      'rate_event_count',
    );
    fireEvent.change(screen.getByLabelText(AnalyticsPipelinesI18nKey.Model, { exact: false }), {
      target: { value: 'gpt-4o' },
    });
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.TriggerOnIngest));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('discards its state when closed and reopened', async () => {
    const user = userEvent.setup();
    const { unmount } = renderEnrichPopup();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'my-rule' } });
    expect(screen.getByDisplayValue('my-rule')).toBeTruthy();

    unmount();
    renderEnrichPopup();

    expect(screen.queryByDisplayValue('my-rule')).toBeNull();
  });

  test('registers a pipeline not running rather than asking', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.EnabledYes)).toBeNull();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(createPipeline).toHaveBeenCalled());
    expect(vi.mocked(createPipeline).mock.calls[0][0].enabled).toBe(false);
  });

  test('collects the authored outputs, bound to the target chosen here', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    await selectTarget(user);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.SectionTransform)).toBeTruthy();
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.AddOutput));
    const column = screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, {
      exact: false,
      selector: 'select',
    });
    expect(Array.from(column.querySelectorAll('option')).map((option) => option.value)).toContain('rate_event_count');
  });

  test('waits for the target before offering a column to bind an output to', () => {
    renderEnrichPopup();

    expect(screen.getByText(AnalyticsPipelinesI18nKey.TransformEmpty)).toBeTruthy();
  });

  test('blocks submission until the form is complete', () => {
    renderEnrichPopup();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('offers no target when every candidate table already has a pipeline', async () => {
    renderEnrichPopup(['turn_feedback']);

    await waitFor(() => expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.Target)).toBeTruthy());
    const options = screen.getByLabelText(AnalyticsPipelinesI18nKey.Target).querySelectorAll('option');
    expect(
      Array.from(options)
        .map((option) => option.value)
        .filter(Boolean),
    ).toEqual([]);
  });

  // A labelled value rather than a field: the service assigns it, and a disabled input would leave the
  // accessibility tree, taking the value with it.
  test('derives the group-by from the target grain key and presents it as a value', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.TriggerGroup));

    await waitFor(() => expect(screen.getByText('response_id')).toBeTruthy());
    expect(screen.queryByDisplayValue('response_id')).toBeNull();
  });

  test('requires a readiness condition for a group rule', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.TriggerGroup));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.ReadyWhenRequired)).toBeTruthy();
  });

  test('offers no inputs editor, which belongs to the detail page', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    await selectTarget(user);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SectionInputs)).toBeNull();
  });

  test('submits the assembled rule and closes on success', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() =>
      expect(createPipeline).toHaveBeenCalledWith({
        name: 'my-rule',
        kind: PipelineKind.Enrich,
        transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
        target: 'turn_feedback',
        trigger: { kind: TriggerKind.OnIngest },
        enabled: false,
      }),
    );
    expect(onCreated).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsPipelinesI18nKey.Created }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('keeps the popup open and shows the service message when creation is rejected', async () => {
    vi.mocked(createPipeline).mockResolvedValue({
      success: false,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'group_by must equal the grain key',
    });
    const user = userEvent.setup();
    renderEnrichPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

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
    vi.mocked(createPipeline).mockResolvedValue({
      success: false,
      status: 409,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'an enrichment admits at most one rule',
    });
    const user = userEvent.setup();
    renderEnrichPopup();

    await fillSubmittableRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(screen.getByDisplayValue('my-rule')).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test('blocks submission while the transform declares no output', async () => {
    const user = userEvent.setup();
    renderEnrichPopup();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'my-rule' } });
    await selectTarget(user);
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.TriggerOnIngest));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });
});
