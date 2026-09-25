import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { deletePipeline, getTable, getTables, updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Pipeline, TriggerKind, PipelineKind, TransformType } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { ApplicationRoute } from '@/src/types/routes';
import { CreatePipelineDto } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');

const refresh = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  source_table: 'dial_usage_log',
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const sourceTable: AnalyticsTable = { name: 'dial_usage_log', type: AnalyticsTableType.Source, columns: [] };

const rule: Pipeline = {
  name: 'feedback-live',
  kind: PipelineKind.Enrich,
  transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

const renderView = (override?: Partial<Pipeline>) =>
  render(<PipelineDetailView pipeline={{ ...rule, ...override }} takenTargets={['turn_feedback']} />);

// Looked up by label, not by current value, so the same helper works when an edit restores the original.
const editSampleFraction = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText(AnalyticsPipelinesI18nKey.SampleFraction, { exact: false });
  await user.clear(input);
  await user.type(input, value);
};

const editScanEvery = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText(AnalyticsPipelinesI18nKey.ScanEvery, { exact: false });
  await user.clear(input);
  await user.type(input, value);
};

describe('PipelineDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(updatePipeline).mockResolvedValue({ success: true });
    vi.mocked(deletePipeline).mockResolvedValue({ success: true });
  });

  test('presents the name as an identity rather than as a field', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'feedback-live' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.Name })).toBeNull();
  });

  // Both facts live inside collapsed sections of the form, so without this the page could not say which
  // table the rule is bound to without a trip back to the listing.
  const header = () =>
    screen.getByRole('heading', { name: 'feedback-live' }).parentElement?.parentElement as HTMLElement;

  const facts = () => screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.ReadOnlyFacts });

  const boundField = (table: string) => screen.getByRole('group', { name: table });

  // Each bound table is reached from its own control, in a new tab, rather than from a second read-only
  // copy of the pair among the facts.
  test('opens each bound table from the control that names it', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await user.click(within(boundField('turn_feedback')).getByRole('button', { name: ButtonsI18nKey.Open }));
    expect(open).toHaveBeenCalledWith('/en/tables/turn_feedback', '_blank');

    await user.click(within(boundField('dial_usage_log')).getByRole('button', { name: ButtonsI18nKey.Open }));
    expect(open).toHaveBeenCalledWith('/en/tables/dial_usage_log', '_blank');

    open.mockRestore();
  });

  // A failed run, a pipeline held at its input's watermark and an output a rebuild left behind are all
  // states an operator acts on. As a line of small print under the facts they read as a footnote to them.
  test('raises the three runtime states as alerts above the facts', () => {
    renderView({
      state: {
        last_error: 'connection refused',
        clamp: { enrichment: 'usage_client_identity' },
        rebuild_required: { enrichment: 'usage_client_identity', rederived_at: '2026-02-02T00:00:00Z' },
      },
    });

    const alerts = screen.getAllByRole('status');

    expect(alerts).toHaveLength(3);
    expect(screen.getByText('connection refused')).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.ClampedByTitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RebuildRequiredTitle)).toBeTruthy();
    expect(within(facts()).queryByRole('status')).toBeNull();
    expect(alerts[0].compareDocumentPosition(facts()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('raises nothing while the runtime reports no such state', () => {
    renderView({ state: { lag_seconds: 12 } });

    expect(screen.queryByRole('status')).toBeNull();
  });

  // The grain key is stated once, among the values the caller cannot change, and its provenance hangs on
  // the label rather than on a caption under a second copy in the trigger.
  test('presents the grain key among the facts, with its provenance on the label', async () => {
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(within(facts()).getByText('response_id')).toBeTruthy();
    expect(screen.getByRole('img', { name: AnalyticsPipelinesI18nKey.GrainKeyHint })).toBeTruthy();
  });

  test('states no grouping key of its own inside a group trigger', async () => {
    renderView({ trigger: { kind: TriggerKind.Group } });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(screen.getAllByText('response_id')).toHaveLength(1);
    expect(within(facts()).getByText('response_id')).toBeTruthy();
  });

  // The presented value follows the target the caller has chosen, which is what the trigger's own copy did:
  // a grouping key that waited for the save would state the old target's grain key in the meantime.
  test('re-derives the presented grain key when the target changes', async () => {
    const other: AnalyticsTable = {
      name: 'session_summary',
      type: AnalyticsTableType.Enrichment,
      source_table: 'dial_usage_log',
      grain: { grain_key: 'chat_id' },
      columns: [],
    };
    const tables = [enrichment, sourceTable, other];
    vi.mocked(getTables).mockResolvedValue(tables);
    vi.mocked(getTable).mockImplementation(async (name) => tables.find((table) => table.name === name) ?? null);

    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    // The ui-kit select is a custom listbox, not a native one: its options exist only while it is open.
    await user.click(within(boundField('turn_feedback')).getByRole('button', { name: /turn_feedback/ }));
    await user.click(await screen.findByRole('option', { name: 'session_summary' }));

    await waitFor(() => expect(within(facts()).getByText('chat_id')).toBeTruthy());
    expect(updatePipeline).not.toHaveBeenCalled();
  });

  test('falls back to the stored grain key while the target is unresolved', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(within(facts()).getByText('response_id')).toBeTruthy();
  });

  test('renders an em dash for a grain key that is neither resolved nor stored', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    renderView({ grain_key: undefined });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(within(facts()).queryByText('response_id')).toBeNull();
    expect(within(facts()).getAllByText(AnalyticsPipelinesI18nKey.NotSet).length).toBeGreaterThan(0);
  });

  test('names neither bound table among the facts', () => {
    renderView();

    expect(within(facts()).queryByText(AnalyticsPipelinesI18nKey.Source)).toBeNull();
    expect(within(facts()).queryByText(AnalyticsPipelinesI18nKey.Target)).toBeNull();
  });

  test('offers no Open while the followed source is unresolved', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    renderView();

    await waitFor(() => expect(getTable).toHaveBeenCalled());
    expect(screen.queryByRole('group', { name: 'dial_usage_log' })).toBeNull();
  });

  test('opens the pinned read source rather than the target’s own', async () => {
    renderView({ inputs: ['otel_claude_code_logs'] });

    await waitFor(() => expect(boundField('otel_claude_code_logs')).toBeTruthy());
  });

  test('offers a control that copies the name', () => {
    renderView();

    // CopyButton names itself `copy {valueLabel}`, so the control is addressable rather than an unnamed icon.
    expect(within(header()).getByRole('button', { name: `copy ${AnalyticsPipelinesI18nKey.Name}` })).toBeTruthy();
  });

  test('states the rule status ahead of its name', () => {
    renderView();

    const badge = screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled);
    const heading = screen.getByRole('heading', { name: 'feedback-live' });

    // The badge leads the header; DOCUMENT_POSITION_FOLLOWING means the heading comes after it.
    expect(badge.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('presents the derived facts read-only', () => {
    renderView();

    const facts = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.ReadOnlyFacts });

    expect(facts).toBeTruthy();
    expect(screen.getByText('response_id')).toBeTruthy();
    expect(screen.getByText('ingested_at')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  // A document among one-word values, repeating what the outputs editor states below; the JSON editor
  // keeps it.
  test('leaves the composed response schema out of the facts', () => {
    renderView({ response_schema: { type: 'object', properties: { rate_event_count: { type: 'number' } } } });

    expect(within(facts()).queryByText(/rate_event_count/)).toBeNull();
  });

  test('offers no evaluator fact and no link to one', () => {
    renderView();

    expect(screen.queryByRole('link', { name: /feedback-rollup/ })).toBeNull();
    expect(screen.queryByText('feedback-rollup@2')).toBeNull();
  });

  test('renders an em dash for an absent version column', () => {
    renderView({ version_column: undefined });

    const versionColumn = within(facts()).getByText(AnalyticsPipelinesI18nKey.VersionColumn).parentElement;
    expect(within(versionColumn as HTMLElement).getByText(AnalyticsPipelinesI18nKey.NotSet)).toBeTruthy();
  });

  test('offers nothing to save until something is edited', async () => {
    renderView();

    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });

  test('offers save and discard once a value changes', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeTruthy();
  });

  test('withdraws save when the value is edited back to what it was', async () => {
    const user = userEvent.setup();
    renderView({ advanced: { scan_every: 'PT1H' } });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();

    await editScanEvery(user, 'PT1H');

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('discard restores the loaded value after confirmation', async () => {
    const user = userEvent.setup();
    renderView({ advanced: { scan_every: 'PT1H' } });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByDisplayValue('PT1H')).toBeTruthy();
  });

  test('saves the whole rule and re-reads it', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [name, dto] = vi.mocked(updatePipeline).mock.calls[0] as [string, CreatePipelineDto];
    expect(name).toBe('feedback-live');
    expect(dto.advanced?.scan_every).toBe('PT2H');
    expect(refresh).toHaveBeenCalled();
  });

  // The service gates the declaration when the pipeline is armed, so what is merely unwritten reaches
  // the save; only a value that was authored and cannot be stored as authored holds it back.
  test('saves a declaration carrying neither trigger nor transform', async () => {
    const user = userEvent.setup();
    renderView({ trigger: undefined, transform: undefined });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as [string, CreatePipelineDto];
    expect(dto).not.toHaveProperty('trigger');
    expect(dto).not.toHaveProperty('transform');
  });

  test('saves an llm transform carrying neither model nor request template', async () => {
    const user = userEvent.setup();
    renderView({ transform: { type: TransformType.Llm, outputs: { rate_event_count: null } } });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as [string, CreatePipelineDto];
    expect(dto.transform?.type).toBe(TransformType.Llm);
  });

  // A pipeline opened by mistake is disposed of where it was opened, rather than from the listing the
  // operator has to navigate back to.
  test('deletes the pipeline from its own header and returns to the listing', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DeletePipeline }));
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DeletePipeline }));

    await waitFor(() => expect(deletePipeline).toHaveBeenCalledWith('feedback-live'));
    expect(push).toHaveBeenCalledWith(ApplicationRoute.AnalyticsPipelines);
  });

  test('the enable control is offered whatever the declaration holds', async () => {
    renderView({ trigger: undefined, transform: undefined, enabled: false });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.EnablePipeline })).toBeEnabled();
  });

  test('a sample fraction of zero still holds the save back', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editSampleFraction(user, '0');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });

  test('carries a member no control presents through the save', async () => {
    const user = userEvent.setup();
    renderView({ filter: 'score > 0.5', advanced: { scan_every: 'PT1H', rate_rpm: 60 } });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as [string, CreatePipelineDto];
    expect(dto.filter).toBe('score > 0.5');
    expect(dto.advanced?.scan_every).toBe('PT2H');
    expect(dto.advanced?.rate_rpm).toBe(60);
  });

  test('never sends a member the API refuses', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as unknown as [string, Record<string, unknown>];
    ['evaluator', 'grain_key', 'version_column', 'generation', 'created_at', 'updated_at', 'state'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });

  test('reports a refused sensitive column as an entitlement failure, not as a rejected expression', async () => {
    vi.mocked(updatePipeline).mockResolvedValue({ success: false, status: 403, errorMessage: 'not entitled' });
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsPipelinesI18nKey.SaveForbidden }),
    );
  });

  test('surfaces the service message and keeps the edit when a save is rejected', async () => {
    vi.mocked(updatePipeline).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'target already bound',
    });
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification.mock.calls[0][0]).toMatchObject({ description: 'target already bound' });
    expect(screen.getByDisplayValue('PT2H')).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  // The default fixture is a sql transform, which renders no request and whose inputs the service
  // refuses — so the section is absent rather than empty, and anything typed there would be dropped.
  test('presents no inputs section for a sql transform', () => {
    renderView();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SectionInputs)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SectionRequestTemplate)).toBeNull();
  });

  // A sql transform renders neither a template nor inputs, hence the llm fixture.
  test('presents the inputs inside the transform block, after the template and before the outputs', () => {
    renderView({ transform: { type: TransformType.Llm, model: 'gpt-4o', outputs: { title: 'Title.' } } });

    const rendered = document.body.textContent ?? '';
    const template = rendered.indexOf(AnalyticsPipelinesI18nKey.SectionRequestTemplate);
    const inputs = rendered.indexOf(AnalyticsPipelinesI18nKey.SectionInputs);
    const outputs = rendered.indexOf(AnalyticsPipelinesI18nKey.SectionOutputs);

    expect(template).toBeGreaterThan(-1);
    expect(inputs).toBeGreaterThan(template);
    expect(outputs).toBeGreaterThan(inputs);
  });

  // The facts row and the scope below it name the same two tables, so they are measured separately: a
  // reader who meets them in opposite orders reads the second as a different pair.
  // The two controls are inline at the top of the form rather than inside a section, so the order is
  // read from the controls themselves.
  test('presents the source control before the target control', async () => {
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    const source = boundField('dial_usage_log');
    const target = boundField('turn_feedback');

    expect(source.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // An aggregate names its input with a plain select rather than the follow-or-pin control, and it is
  // ordered the same way.
  test('presents the input before the target for an aggregate pipeline', async () => {
    const rollup: AnalyticsTable = { name: 'usage_rollup', type: AnalyticsTableType.Source, columns: [] };
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable, rollup]);

    renderView({
      kind: PipelineKind.Aggregate,
      target: 'usage_rollup',
      inputs: ['dial_usage_log'],
      transform: undefined,
      trigger: { kind: TriggerKind.Schedule, cron: '0 0 * * * *' },
      measures: [{ name: 'requests', fn: 'count' }],
    });

    await waitFor(() => expect(getTables).toHaveBeenCalled());

    const input = boundField('dial_usage_log');
    const target = boundField('usage_rollup');
    const runs = screen.getByLabelText(AnalyticsPipelinesI18nKey.CronPreset, { exact: false });

    expect(input.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // What it reads and writes is settled before when it runs, which is the order the fields are filled in.
    expect(target.compareDocumentPosition(runs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('groups the members into collapsible sections', () => {
    renderView();

    [AnalyticsPipelinesI18nKey.SectionTransform, AnalyticsPipelinesI18nKey.SectionAdvanced].forEach((section) =>
      expect(screen.getByRole('button', { name: section })).toBeTruthy(),
    );
  });

  test('leaves identity and trigger open rather than behind a section header', () => {
    renderView();

    // The two an operator always needs are flat; only the optional groups collapse.
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.Name, { exact: false })).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.TriggerKind)).toBeTruthy();
  });

  test('offers enabling as its own action rather than a form field', () => {
    renderView();

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeTruthy();
  });

  // Disabling stops a pipeline and deleting destroys it; drawing both in danger said they weighed the
  // same, and the two sit side by side in the header.
  test('reserves the danger treatment for deleting, not for disabling', () => {
    renderView();

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }).className).not.toContain(
      'danger',
    );
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DeletePipeline }).className).toContain(
      'dial-danger-outlined-button',
    );
  });

  test('presents enabling as the primary action', () => {
    renderView({ enabled: false });

    const toggle = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.EnablePipeline });
    expect(toggle.className).toContain('dial-primary-solid-button');
  });

  test('confirms before disabling a rule', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.DisableConfirmTitle)).toBeTruthy();
    expect(updatePipeline).not.toHaveBeenCalled();
  });

  test('flips enabled on its own rather than re-declaring the pipeline', async () => {
    const user = userEvent.setup();
    renderView({ filter: 'score > 0.5' });
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));
    // The popup takes over the query scope, so this now uniquely matches its confirm button.
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as [string, CreatePipelineDto];
    // A body carrying any declaration member re-declares the pipeline, which a running aggregate one
    // answers 409 for.
    expect(dto).toEqual({ enabled: false });
    expect(refresh).toHaveBeenCalled();
  });

  // The standing actions step aside for the change bar rather than sitting beside it disabled: a toggle
  // re-reads the pipeline, which would discard the edits.
  test('withholds the toggle and delete while edits are pending', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getTable).toHaveBeenCalled());

    await editScanEvery(user, 'PT2H');

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeNull();
    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.DeletePipeline })).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
  });

  test('opens on the sections a rule is usually read for', () => {
    renderView();

    // Identity is expanded, so its first control is on screen without a click.
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.Name, { exact: false })).toBeTruthy();
  });

  test('still offers the rule its own target even though it is taken', async () => {
    renderView();

    await waitFor(() => expect(screen.getByText('turn_feedback')).toBeTruthy());
  });
});
