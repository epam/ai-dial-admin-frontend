import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PipelinePreview from '@/src/components/Analytics/Pipelines/Preview/PipelinePreview';
import { PreviewRunKind, PreviewSection } from '@/src/components/Analytics/Pipelines/Preview/models';
import {
  aggregatePipeline,
  evaluationMock,
  llmGroupPipeline,
  llmPipeline,
  llmPreviewMock,
  noteMock,
  previewMock,
  sqlPipeline,
} from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import { PipelinePreviewRun } from '@/src/components/Analytics/Pipelines/Preview/use-pipeline-preview';
import { ButtonsI18nKey, PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { Pipeline, TransformPreset, TransformType } from '@/src/models/analytics/pipeline';
import { DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';
import {
  PipelinePreview as PipelinePreviewResult,
  PreviewColumnRole,
  PreviewNoteCode,
  PreviewNoteSeverity,
} from '@/src/models/analytics/pipeline-preview';

// The grid's own contract is covered where it lives; here it stands in for "the sample was drawn".
vi.mock('@/src/components/Analytics/Pipelines/Preview/PreviewGrid', () => ({
  default: ({ columns, rows }: { columns: { name: string }[]; rows: unknown[] }) => (
    <table aria-label="sample">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.name}>{column.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((_, index) => (
          <tr key={index}>
            <td>row</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

const run = vi.fn();
const runWithModel = vi.fn();
const onOpenSection = vi.fn();
const onOpenRuntime = vi.fn();

const previewRun = (overrides: Partial<PipelinePreviewRun> = {}): PipelinePreviewRun => ({
  isRunning: false,
  runningKind: overrides.isRunning ? PreviewRunKind.Preview : undefined,
  run,
  runWithModel,
  ...overrides,
});

interface Setup {
  pipeline?: Pipeline;
  preview?: Partial<PipelinePreviewRun>;
  hasUnsavedEdits?: boolean;
  isRunnerAvailable?: boolean;
}

const renderTab = ({
  pipeline = sqlPipeline(),
  preview,
  hasUnsavedEdits = false,
  isRunnerAvailable = false,
}: Setup = {}) =>
  render(
    <PipelinePreview
      pipeline={pipeline}
      preview={previewRun(preview)}
      hasUnsavedEdits={hasUnsavedEdits}
      isRunnerAvailable={isRunnerAvailable}
      onOpenSection={onOpenSection}
      onOpenRuntime={onOpenRuntime}
    />,
  );

const withResult = (result: PipelinePreviewResult, overrides: Partial<PipelinePreviewRun> = {}) => ({
  result,
  sampledGeneration: 6,
  ...overrides,
});

const key = (name: keyof typeof PipelinePreviewI18nKey) => PipelinePreviewI18nKey[name];

describe('PipelinePreview — before the first run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each([
    ['an aggregate', aggregatePipeline(), 'FirstVisitAggregate'],
    ['an SQL enrichment', sqlPipeline(), 'FirstVisitSql'],
    ['a row-by-row LLM enrichment', llmPipeline(), 'FirstVisitLlmRow'],
    ['a group-trigger LLM enrichment', llmGroupPipeline(), 'FirstVisitLlmGroup'],
  ] as const)('describes the preview of %s and offers Run preview', (_, pipeline, text) => {
    renderTab({ pipeline });

    expect(screen.getByText(key('FirstVisitTitle'))).toBeInTheDocument();
    expect(screen.getByText(key(text))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: key('RunPreview') })).toBeInTheDocument();
  });

  test('runs with no argument when Run preview is pressed', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: key('RunPreview') }));

    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith();
  });

  test('disables the run control and says it is reading while the first run is in flight', () => {
    renderTab({ preview: { isRunning: true } });

    expect(screen.getByRole('button', { name: key('Running') })).toBeDisabled();
    expect(screen.getByText(key('ReadingTitle'))).toBeInTheDocument();
    expect(screen.queryByText(key('FirstVisitTitle'))).toBeNull();
  });
});

describe('PipelinePreview — a result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('draws the sample under count chips and offers Run again', async () => {
    const user = userEvent.setup();
    renderTab({ preview: withResult(previewMock()) });

    expect(screen.getByRole('columnheader', { name: 'event_id' })).toBeInTheDocument();
    expect(screen.getByText(key('ChipLabelSampleRows'))).toBeInTheDocument();
    expect(screen.getByText(key('ChipLabelOutputSingular'))).toBeInTheDocument();
    expect(screen.getByText(key('ChipLabelNotes'))).toBeInTheDocument();
    expect(screen.getByText(key('CaptionNewest'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: key('RunAgain') }));
    expect(run).toHaveBeenCalledOnce();
  });

  test('states an aggregate as N of M groups', () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({ chat_id: String(index) }));
    renderTab({
      pipeline: aggregatePipeline(),
      preview: withResult(
        previewMock({
          rows,
          total_rows: 1284,
          columns: [{ name: 'chat_id', role: PreviewColumnRole.Key, type: 'string', target_type: 'string' }],
        }),
      ),
    });

    expect(screen.getByText(key('ChipLabelGroups'))).toBeInTheDocument();
    expect(screen.getByText(key('ChipCountOfTotal'))).toBeInTheDocument();
  });

  test('keeps the previous result on screen while a rerun is in flight', () => {
    renderTab({ preview: withResult(previewMock(), { isRunning: true }) });

    expect(screen.getByRole('table', { name: 'sample' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: key('Running') })).toBeDisabled();
  });

  describe('notes and the success line', () => {
    test('states the success line for a disabled pipeline when there are no notes', () => {
      renderTab({ preview: withResult(previewMock()) });

      expect(screen.getByText(key('SuccessReadyToEnable'))).toBeInTheDocument();
    });

    test('states validation passed for an enabled aggregate', () => {
      renderTab({
        pipeline: aggregatePipeline({ enabled: true }),
        preview: withResult(previewMock({ total_rows: 2 })),
      });

      expect(screen.getByText(key('SuccessValidationPassed'))).toBeInTheDocument();
    });

    test('claims only no issues found for an enabled enrichment', () => {
      renderTab({ pipeline: sqlPipeline({ enabled: true }), preview: withResult(previewMock()) });

      expect(screen.getByText(key('SuccessNoIssues'))).toBeInTheDocument();
    });

    test('draws a warning with its subject and message and no success line', () => {
      renderTab({
        preview: withResult(
          previewMock({
            notes: [
              noteMock({
                code: PreviewNoteCode.TargetTypeNarrowing,
                severity: PreviewNoteSeverity.Warning,
                subject: 'request_count',
                message: 'count would be narrowed to integer',
              }),
            ],
          }),
        ),
      });

      expect(screen.getByText(key('NoteTitleTargetTypeNarrowing'))).toBeInTheDocument();
      expect(screen.getByText('request_count')).toBeInTheDocument();
      expect(screen.getByText('count would be narrowed to integer')).toBeInTheDocument();
      expect(screen.queryByText(key('SuccessReadyToEnable'))).toBeNull();
    });

    test('counts the notes drawn as banners, and a single one in the singular', () => {
      renderTab({
        preview: withResult(
          previewMock({
            notes: [
              noteMock({ code: PreviewNoteCode.NoMatchingRows, severity: PreviewNoteSeverity.Warning }),
              noteMock({ code: PreviewNoteCode.ValuesTruncated, severity: PreviewNoteSeverity.Info }),
            ],
          }),
        ),
      });

      expect(screen.getByText(key('ChipLabelNoteSingular'))).toBeInTheDocument();
      expect(screen.queryByText(key('ChipLabelNotes'))).toBeNull();
      expect(screen.getByText(key('NoteTitleValuesTruncated'))).toBeInTheDocument();
    });

    test('puts a warning above an informational note', () => {
      renderTab({
        preview: withResult(
          previewMock({
            notes: [
              noteMock({ code: PreviewNoteCode.ValuesTruncated, severity: PreviewNoteSeverity.Info }),
              noteMock({ code: PreviewNoteCode.TargetTypeNarrowing, severity: PreviewNoteSeverity.Warning }),
            ],
          }),
        ),
      });

      const warning = screen.getByText(key('NoteTitleTargetTypeNarrowing'));
      const info = screen.getByText(key('NoteTitleValuesTruncated'));

      expect(warning.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('shows a note with a code the console does not know under a generic title', () => {
      renderTab({
        preview: withResult(
          previewMock({ notes: [noteMock({ code: 'added_upstream_later', message: 'something new' })] }),
        ),
      });

      expect(screen.getByText(key('NoteTitleUnknown'))).toBeInTheDocument();
      expect(screen.getByText('something new')).toBeInTheDocument();
    });

    test('shows the grid beneath a held warning, because the rows are late rather than missing', () => {
      renderTab({
        preview: withResult(
          previewMock({
            notes: [
              noteMock({
                code: PreviewNoteCode.HeldByEnrichment,
                severity: PreviewNoteSeverity.Warning,
                subject: 'chat_topics',
              }),
            ],
          }),
        ),
      });

      expect(screen.getByText(key('NoteTitleHeldByEnrichment'))).toBeInTheDocument();
      expect(screen.getByRole('table', { name: 'sample' })).toBeInTheDocument();
      expect(screen.queryByText(key('EmptyHeldTitle'))).toBeNull();
    });
  });

  describe('an empty sample', () => {
    const empty = (code: PreviewNoteCode, overrides: Partial<PipelinePreviewResult> = {}) =>
      previewMock({
        rows: [],
        notes: [noteMock({ code, severity: PreviewNoteSeverity.Warning, message: 'because' })],
        ...overrides,
      });

    test('says no data yet for an input with no rows when the declaration has no filter', () => {
      renderTab({ preview: withResult(empty(PreviewNoteCode.NoMatchingRows)) });

      expect(screen.getByText(key('EmptyNoDataTitle'))).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'event_id' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: key('EmptyOpenProperties') })).toBeNull();
    });

    test('says no matching rows and opens Properties when the declaration has a filter', async () => {
      const user = userEvent.setup();
      renderTab({
        pipeline: sqlPipeline({ filter: "event_kind = 'chat'" }),
        preview: withResult(empty(PreviewNoteCode.NoMatchingRows)),
      });

      expect(screen.getByText(key('EmptyNoMatchTitle'))).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: key('EmptyOpenProperties') }));

      expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.Properties);
    });

    test('does not repeat the empty-state cause as a banner', () => {
      renderTab({ preview: withResult(empty(PreviewNoteCode.NoMatchingRows)) });

      expect(screen.queryByText(key('NoteTitleNoMatchingRows'))).toBeNull();
    });

    test('says no group found for a group pipeline with none, and opens Properties', async () => {
      const user = userEvent.setup();
      renderTab({
        pipeline: llmGroupPipeline(),
        preview: withResult(empty(PreviewNoteCode.NoGroupFound)),
      });

      expect(screen.getByText(key('EmptyNoGroupTitle'))).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: key('EmptyOpenProperties') }));
      expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.Properties);
    });

    test('names the enrichment every row is held by and offers to open it', () => {
      renderTab({
        pipeline: llmPipeline(),
        preview: withResult(
          previewMock({
            rows: [],
            notes: [
              noteMock({
                code: PreviewNoteCode.HeldByEnrichment,
                severity: PreviewNoteSeverity.Warning,
                subject: 'customer_accounts',
              }),
            ],
          }),
        ),
      });

      expect(screen.getByText(key('EmptyHeldTitle'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: key('EmptyOpenEnrichment') })).toBeInTheDocument();
    });
  });

  describe('the statement and the outputs', () => {
    test('draws the Statement section for an SQL pipeline and no Outputs section', () => {
      renderTab({ preview: withResult(previewMock({ statement: 'SELECT 1' })) });

      expect(screen.getByText(key('StatementTitle'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: key('CopySql') })).toBeInTheDocument();
      expect(screen.queryByText(key('OutputsTitle'))).toBeNull();
    });

    test('draws Outputs instead of a statement for an LLM pipeline and flags an undescribed output', () => {
      renderTab({
        pipeline: llmPipeline(),
        preview: withResult(
          previewMock({
            statement: undefined,
            notes: [
              noteMock({
                code: PreviewNoteCode.OutputWithoutDescription,
                severity: PreviewNoteSeverity.Info,
                subject: 'risk',
              }),
            ],
          }),
        ),
      });

      expect(screen.queryByText(key('StatementTitle'))).toBeNull();
      expect(screen.getByText(key('OutputsTitle'))).toBeInTheDocument();
      expect(screen.getByText('sentiment')).toBeInTheDocument();
      expect(screen.getByText('The subject of the chat')).toBeInTheDocument();
      // One flag, on the output the service named — the other two carry prose of their own.
      expect(screen.getAllByText(key('OutputNoDescription'))).toHaveLength(1);
    });
  });

  describe('the group chip', () => {
    test('names the sampled group and counts members', () => {
      renderTab({
        pipeline: llmGroupPipeline(),
        preview: withResult(previewMock({ statement: undefined, group_key: 'chat-42' })),
      });

      expect(screen.getByText('chat-42')).toBeInTheDocument();
      expect(screen.getByText(key('ChipLabelMembersShown'))).toBeInTheDocument();
      expect(screen.getByText(key('CaptionMembers'))).toBeInTheDocument();
    });

    test('states the group a rerun left', () => {
      renderTab({
        pipeline: llmGroupPipeline(),
        preview: withResult(previewMock({ statement: undefined, group_key: 'B' }), { previousGroupKey: 'A' }),
      });

      expect(screen.getByText(key('GroupWas'))).toBeInTheDocument();
    });

    test('states no previous group when the rerun stayed on the same one', () => {
      renderTab({
        pipeline: llmGroupPipeline(),
        preview: withResult(previewMock({ statement: undefined, group_key: 'A' })),
      });

      expect(screen.queryByText(key('GroupWas'))).toBeNull();
    });
  });
});

describe('PipelinePreview — a failed run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const failed = (code: string | undefined, message?: string, status?: number) => ({
    failure: { code, message, status },
  });

  test('says to fix the declaration, shows the service message, and opens Properties', async () => {
    const user = userEvent.setup();
    renderTab({ preview: failed('pipeline_validation_failed', 'transform.outputs is empty', 422) });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(key('ErrValidationTitle'))).toBeInTheDocument();
    expect(screen.getByText('transform.outputs is empty')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: key('EmptyOpenProperties') }));
    expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.Properties);
  });

  test('opens the request template when the validation message names it', async () => {
    const user = userEvent.setup();
    renderTab({
      pipeline: llmPipeline(),
      preview: failed('pipeline_validation_failed', 'transform.request_template references {{ticket_body}}', 422),
    });

    await user.click(screen.getByRole('button', { name: key('OpenRequestTemplate') }));

    expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.RequestTemplate);
  });

  test('offers the group keys and Properties for a budget refusal of an aggregate, with no retry', async () => {
    const user = userEvent.setup();
    renderTab({
      pipeline: aggregatePipeline(),
      preview: failed('pipeline_preview_budget_exceeded', 'exceeded the 2GB memory ceiling', 422),
    });

    expect(screen.getByText(key('ErrBudgetTitle'))).toBeInTheDocument();
    expect(screen.getByText(key('ErrBudgetHint'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: key('OpenGroupKeys') }));
    expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.GroupKeys);

    await user.click(screen.getByRole('button', { name: key('EmptyOpenProperties') }));
    expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.Properties);
    expect(run).not.toHaveBeenCalled();
  });

  test('offers the member selection for a budget refusal of a group-trigger pipeline', () => {
    renderTab({
      pipeline: llmGroupPipeline(),
      preview: failed('pipeline_preview_budget_exceeded', 'too heavy', 422),
    });

    expect(screen.getByRole('button', { name: key('OpenMemberSelection') })).toBeInTheDocument();
  });

  test('shows the code of a failure it has no state for, and keeps Run again', async () => {
    const user = userEvent.setup();
    renderTab({ preview: failed('pipeline_conflict', 'conflicts with an enabled pipeline', 409) });

    expect(screen.getByText(key('ErrGenericTitle'))).toBeInTheDocument();
    expect(screen.getByText('conflicts with an enabled pipeline')).toBeInTheDocument();
    expect(screen.getByText(key('ErrGenericCode'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: key('RunAgain') }));
    expect(run).toHaveBeenCalledOnce();
  });

  test('says storage is down and offers Try again', async () => {
    const user = userEvent.setup();
    renderTab({ preview: failed('clickhouse_unavailable', 'unavailable', 503) });

    expect(screen.getByText(key('ErrStorageTitle'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: key('TryAgain') }));
    expect(run).toHaveBeenCalledOnce();
  });

  test('explains no access in place of the tab and offers no run control', () => {
    renderTab({ preview: failed('sensitive_column_not_entitled', 'reads dial_usage_log.user_email', 403) });

    expect(screen.getByText(key('NoAccessTitle'))).toBeInTheDocument();
    expect(screen.getByText('reads dial_usage_log.user_email')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // A line that says the declaration is valid cannot sit beside the failure that says it is not.
  test('withholds the success line from an earlier result held under a failure', () => {
    renderTab({
      preview: withResult(previewMock(), failed('pipeline_validation_failed', 'transform.outputs is empty', 422)),
    });

    expect(screen.queryByText(key('SuccessReadyToEnable'))).toBeNull();
  });

  test('keeps the earlier result under the failure, dimmed and out of the reading order', () => {
    renderTab({
      preview: withResult(previewMock(), failed('pipeline_validation_failed', 'transform.outputs is empty', 422)),
    });

    expect(screen.getByText('transform.outputs is empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: key('RunAgain') })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'sample' }).closest('[inert]')).not.toBeNull();
    expect(screen.getByText(key('ErrLastRunFailed'))).toBeInTheDocument();
  });
});

describe('PipelinePreview — what the run was made on', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('says the preview uses the saved version when there are unsaved edits, and offers no way to save', () => {
    renderTab({ hasUnsavedEdits: true, preview: withResult(previewMock()) });

    expect(screen.getByText(key('UnsavedTitle'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: key('RunOnSavedVersion') })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'sample' }).closest('[inert]')).not.toBeNull();
    // Saving belongs to the page's own Save; the tab only says what the run was made on.
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('offers Run on saved version before any run when there are unsaved edits', () => {
    renderTab({ hasUnsavedEdits: true });

    expect(screen.getByRole('button', { name: key('RunOnSavedVersion') })).toBeInTheDocument();
  });

  test('says the result is older than the declaration when the generation moved on', async () => {
    const user = userEvent.setup();
    renderTab({
      pipeline: sqlPipeline({ generation: 7 }),
      preview: withResult(previewMock(), { sampledGeneration: 6 }),
    });

    const banner = screen.getByText(key('StaleTitle')).closest('[role="status"]') as HTMLElement;
    expect(banner).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'sample' }).closest('[inert]')).not.toBeNull();

    await user.click(within(banner).getByRole('button', { name: key('RunAgain') }));
    expect(run).toHaveBeenCalledOnce();
  });

  test('states no staleness when the generation is the one that was sampled', () => {
    renderTab({
      pipeline: sqlPipeline({ generation: 6 }),
      preview: withResult(previewMock(), { sampledGeneration: 6 }),
    });

    expect(screen.queryByText(key('StaleTitle'))).toBeNull();
    expect(screen.getByRole('table', { name: 'sample' }).closest('[inert]')).toBeNull();
  });

  test('says unsaved edits rather than staleness when both hold, since saving is what resolves both', () => {
    renderTab({
      hasUnsavedEdits: true,
      pipeline: sqlPipeline({ generation: 7 }),
      preview: withResult(previewMock(), { sampledGeneration: 6 }),
    });

    expect(screen.getByText(key('UnsavedTitle'))).toBeInTheDocument();
    expect(screen.queryByText(key('StaleTitle'))).toBeNull();
  });
});

describe('PipelinePreview — announcing a finished run', () => {
  const pipeline = sqlPipeline();
  const setup = (preview: Partial<PipelinePreviewRun>) => (
    <PipelinePreview
      pipeline={pipeline}
      preview={previewRun(preview)}
      hasUnsavedEdits={false}
      isRunnerAvailable={false}
      onOpenSection={onOpenSection}
      onOpenRuntime={onOpenRuntime}
    />
  );

  test('announces the row count through its own region when a run returns', () => {
    const { rerender } = render(setup({ isRunning: true }));
    expect(screen.queryByText(key('RunFinished'))).toBeNull();

    rerender(setup(withResult(previewMock())));

    expect(screen.getByText(key('RunFinished'))).toBeInTheDocument();
  });

  test('announces an empty result in words of its own', () => {
    const { rerender } = render(setup({ isRunning: true }));

    rerender(setup(withResult(previewMock({ rows: [] }))));

    expect(screen.getByText(key('RunFinishedNoRows'))).toBeInTheDocument();
  });

  test('announces nothing when a run fails', () => {
    const { rerender } = render(setup({ isRunning: true }));

    rerender(setup({ failure: { code: 'pipeline_conflict', message: 'x', status: 409 } }));

    expect(screen.queryByText(key('RunFinished'))).toBeNull();
    expect(screen.queryByText(key('RunFinishedNoRows'))).toBeNull();
  });

  test('announces nothing when the tab is opened on a result that is already held', () => {
    render(setup(withResult(previewMock())));

    expect(screen.queryByText(key('RunFinished'))).toBeNull();
  });
});

describe('PipelinePreview — run with model', () => {
  const chatPipeline = (overrides: Partial<Pipeline> = {}) =>
    llmPipeline({
      transform: {
        type: TransformType.Llm,
        preset: TransformPreset.ChatCompletion,
        model: 'gpt-4o-mini',
        outputs: { sentiment: 'How the user felt' },
      },
      ...overrides,
    });

  const routePipeline = () =>
    llmPipeline({
      transform: {
        type: TransformType.Llm,
        preset: TransformPreset.DialAppRoute,
        model: 'insights-app',
        route: 'insights',
        outputs: { topic: 'The subject' },
      },
    });

  const renderModelTab = (setup: Setup = {}) =>
    renderTab({ pipeline: chatPipeline(), isRunnerAvailable: true, ...setup });

  const withModelResult = (overrides: Partial<PipelinePreviewRun> = {}) =>
    withResult(llmPreviewMock(), { evaluations: [evaluationMock()], ...overrides });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('availability', () => {
    test('offers the model run beside the preview for an LLM enrichment', () => {
      renderModelTab();

      expect(screen.getByRole('button', { name: key('RunPreview') })).toBeEnabled();
      expect(screen.getByRole('button', { name: key('RunWithModel') })).toBeEnabled();
      expect(screen.getByText(key('FirstVisitModelHint'))).toBeTruthy();
    });

    test.each([
      ['an aggregate', aggregatePipeline()],
      ['an SQL enrichment', sqlPipeline()],
    ])('does not render the model run for %s', (_, pipeline) => {
      renderTab({ pipeline, isRunnerAvailable: true });

      expect(screen.getByRole('button', { name: key('RunPreview') })).toBeTruthy();
      expect(screen.queryByRole('button', { name: key('RunWithModel') })).toBeNull();
    });

    test('does not render the model run when the runner is not available', () => {
      renderTab({ pipeline: chatPipeline(), isRunnerAvailable: false });

      expect(screen.getByRole('button', { name: key('RunPreview') })).toBeTruthy();
      expect(screen.queryByRole('button', { name: key('RunWithModel') })).toBeNull();
    });
  });

  describe('labels', () => {
    test('reads Run again with model once a model result is held', () => {
      renderModelTab({ preview: withModelResult() });

      expect(screen.getByRole('button', { name: key('RunAgainWithModel') })).toBeTruthy();
    });

    test('names the saved version beside an unsaved edit', () => {
      renderModelTab({ hasUnsavedEdits: true });

      expect(screen.getByRole('button', { name: key('RunSavedVersionWithModel') })).toBeTruthy();
      expect(screen.getByText(key('UnsavedTitleWithModel'))).toBeTruthy();
    });

    test('disables both controls and names the model while a model run is in flight', () => {
      renderModelTab({
        preview: withResult(previewMock(), { isRunning: true, runningKind: PreviewRunKind.Model }),
      });

      expect(screen.getByRole('button', { name: key('RunningWithModel') })).toBeDisabled();
      expect(screen.getByRole('button', { name: key('RunAgain') })).toBeDisabled();
      expect(screen.getByText(key('WaitingRowTitle'))).toBeTruthy();
      expect(screen.getByText(key('WaitingHint'))).toBeTruthy();
    });
  });

  describe('confirmation', () => {
    test('asks before running and runs on confirm', async () => {
      const user = userEvent.setup();
      renderModelTab();

      await user.click(screen.getByRole('button', { name: key('RunWithModel') }));

      expect(screen.getByText(key('ConfirmBodyRow'))).toBeTruthy();
      expect(screen.getByText('gpt-4o-mini')).toBeTruthy();
      expect(screen.getByText(key('ConfirmCallsChat'))).toBeTruthy();
      expect(runWithModel).not.toHaveBeenCalled();

      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: key('RunWithModel') }));

      expect(runWithModel).toHaveBeenCalledOnce();
    });

    test('issues nothing on cancel', async () => {
      const user = userEvent.setup();
      renderModelTab();

      await user.click(screen.getByRole('button', { name: key('RunWithModel') }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(screen.queryByText(key('ConfirmBodyRow'))).toBeNull();
      expect(runWithModel).not.toHaveBeenCalled();
    });

    test('names the application and route and one call for an application route', async () => {
      const user = userEvent.setup();
      renderTab({ pipeline: routePipeline(), isRunnerAvailable: true });

      await user.click(screen.getByRole('button', { name: key('RunWithModel') }));

      expect(screen.getByText('insights-app')).toBeTruthy();
      expect(screen.getByText('insights')).toBeTruthy();
      expect(screen.getByText(key('ConfirmCallsRoute'))).toBeTruthy();
    });

    test('speaks of the newest group for a group pipeline', async () => {
      const user = userEvent.setup();
      renderTab({ pipeline: llmGroupPipeline(), isRunnerAvailable: true });

      await user.click(screen.getByRole('button', { name: key('RunWithModel') }));

      expect(screen.getByText(key('ConfirmBodyGroup'))).toBeTruthy();
    });
  });

  describe('result', () => {
    test('states an ok outcome and the panel in place of the outputs section', () => {
      renderModelTab({ preview: withModelResult() });

      expect(screen.getByText(key('OutcomeOkTitle'))).toBeTruthy();
      expect(screen.getByRole('region', { name: key('PanelTitle') })).toBeTruthy();
      expect(screen.queryByText(key('OutputsTitle'))).toBeNull();
      expect(screen.getByText(key('ChipLabelRowTried'))).toBeTruthy();
      expect(screen.getByText(key('ValuesTitle'))).toBeTruthy();
      expect(screen.getByRole('list', { name: key('StagesLabel') })).toBeTruthy();
    });

    test('states a schema failure as an alert with the violations', () => {
      renderModelTab({
        preview: withModelResult({
          evaluations: [
            evaluationMock({
              status: ModelRunStatus.Failed,
              stage: DlqStage.Validate,
              attempts: 2,
              outputs: undefined,
              errors: ["$: required property 'sentiment' not found"],
            }),
          ],
        }),
      });

      expect(within(screen.getByRole('alert')).getByText(key('OutcomeValidateTitle'))).toBeTruthy();
      expect(screen.getByText("$: required property 'sentiment' not found")).toBeTruthy();
      expect(screen.getByText(key('AttemptsWithRetries'))).toBeTruthy();
      expect(screen.getByText(key('RetryNote'))).toBeTruthy();
    });

    test('states a DIAL refusal with its status', () => {
      renderModelTab({
        preview: withModelResult({
          evaluations: [
            evaluationMock({
              status: ModelRunStatus.Failed,
              stage: DlqStage.DialCall,
              dial_status: 404,
              message: "Deployment 'gpt-4o-mini-eu' was not found",
              outputs: undefined,
            }),
          ],
        }),
      });

      expect(screen.getByText(key('OutcomeDialTitle'))).toBeTruthy();
      expect(screen.getByText("Deployment 'gpt-4o-mini-eu' was not found")).toBeTruthy();
    });

    test('marks a cut request', () => {
      renderModelTab({ preview: withModelResult({ evaluations: [evaluationMock({ request_truncated: true })] }) });

      expect(screen.getByText(key('Truncated'))).toBeTruthy();
      expect(screen.getByText(key('TruncatedHint'))).toBeTruthy();
    });

    test('shows a reply that is not JSON verbatim', () => {
      renderModelTab({ preview: withModelResult({ evaluations: [evaluationMock({ response: 'not json {' })] }) });

      expect(screen.getByText('not json {')).toBeTruthy();
    });

    test('states the members sent for a partial group', () => {
      renderTab({
        pipeline: llmGroupPipeline(),
        isRunnerAvailable: true,
        preview: withResult(previewMock({ statement: undefined, group_key: 'conv-1' }), {
          evaluations: [
            evaluationMock({
              grain_key: undefined,
              group_key: 'conv-1',
              members_included: 12,
              members_omitted: 3,
              members_truncated: true,
            }),
          ],
        }),
      });

      expect(screen.getByText(key('OutcomeOkGroupTitle'))).toBeTruthy();
      expect(screen.getByText(key('PanelGroupNote'))).toBeTruthy();
      expect(screen.getByText(key('FactMembersSent'))).toBeTruthy();
      expect(screen.getByText(key('PartialGroup'))).toBeTruthy();
      expect(screen.getByText(key('ChipLabelGroupTried'))).toBeTruthy();
    });

    test('offers Run again with model in the stale banner', () => {
      renderModelTab({ pipeline: chatPipeline({ generation: 7 }), preview: withModelResult() });

      expect(screen.getAllByRole('button', { name: key('RunAgainWithModel') })).toHaveLength(2);
    });
  });

  describe('refusals', () => {
    const refused = (code: string, status: number, message = 'refused') =>
      withModelResult({ evaluations: undefined, failure: { code, status, message, isModelRun: true } });

    test('says a model run is already in flight and offers to run again', async () => {
      const user = userEvent.setup();
      renderModelTab({ preview: refused('dry_run_in_progress', 409) });

      const alert = screen.getByRole('alert');
      expect(within(alert).getByText(key('ErrInProgressTitle'))).toBeTruthy();
      await user.click(within(alert).getByRole('button', { name: key('RunAgainWithModel') }));

      expect(screen.getByText(key('ConfirmBodyRow'))).toBeTruthy();
    });

    test('opens Runtime from a used-up budget', async () => {
      const user = userEvent.setup();
      renderModelTab({ preview: refused('spend_budget_exhausted', 429, 'Daily budget reached') });

      expect(screen.getByText('Daily budget reached')).toBeTruthy();
      await user.click(screen.getByRole('button', { name: key('OpenRuntime') }));

      expect(onOpenRuntime).toHaveBeenCalledOnce();
    });

    test('opens Properties from a declaration the runner cannot run', async () => {
      const user = userEvent.setup();
      renderModelTab({ preview: refused('pipeline_not_runnable', 422) });

      expect(screen.getByText(key('ErrNotRunnableTitle'))).toBeTruthy();
      await user.click(screen.getByRole('button', { name: key('EmptyOpenProperties') }));

      expect(onOpenSection).toHaveBeenCalledWith(PreviewSection.Properties);
    });

    test.each(['adas_unavailable', 'adas_contract_mismatch'])('reads %s as an unreadable sample', (code) => {
      renderModelTab({ preview: refused(code, 503) });

      expect(screen.getByText(key('ErrSampleTitle'))).toBeTruthy();
      expect(screen.getByRole('button', { name: key('RunAgainWithModel') })).toBeTruthy();
    });

    test('reuses the preview state for a registry refusal', () => {
      renderModelTab({ preview: refused('pipeline_validation_failed', 422) });

      expect(screen.getByText(key('ErrValidationTitle'))).toBeTruthy();
    });

    test('disables the control on a runner without model runs', () => {
      renderModelTab({
        preview: { ...refused('not_found', 404), isModelRunUnsupported: true },
      });

      expect(screen.getByText(key('ErrUnsupportedTitle'))).toBeTruthy();
      expect(screen.getByRole('button', { name: key('RunWithModel') })).toBeDisabled();
    });
  });
});
