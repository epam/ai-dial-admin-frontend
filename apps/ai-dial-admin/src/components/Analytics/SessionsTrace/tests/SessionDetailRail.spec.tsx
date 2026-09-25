import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import SessionDetailRail from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailRail';
import {
  SESSIONS_ENTITY,
  SESSION_DETAIL_PANELS,
  SESSION_FEEDBACK_PANEL,
  SESSION_INSIGHTS_PANEL,
  FEEDBACK_ENTITY,
  PROVENANCE_TEXT_CLASS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  SessionDetailRow,
  SessionFeedbackRow,
  SessionRatingCounts,
  SessionsField,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { insightColumnsOf } from '@/src/utils/analytics/session-insights';

const SESSION: SessionDetailRow = {
  client_session_id: 'Lrr0e6L5bpTND3IY_dN0_',
  project_id: '',
  user_hash: 'db7327ba3decd351',
  turn_count: 12,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 4293420,
  completion_tokens: 70174,
  total_tokens: 4363594,
  total_price: '10.79380012',
  success_count: 0,
  duration_ms: 0,
  avg_duration_ms: 0,
  deployments: ['anthropic_switchyard-model', 'anthropic.claude-opus-4-8'],
  traces: ['0a3f1d9c8b7e6a5f', '4c81be02d5aa77e1'],
};

const feedbackRow = (overrides: Partial<SessionFeedbackRow> = {}): SessionFeedbackRow => ({
  response_id: 'chatcmpl-a',
  first_rate_time: '2026-07-20T19:12:59.268Z',
  last_rate_time: '2026-07-20T19:12:59.268Z',
  rate_pos_count: 1,
  rate_zero_count: 0,
  rate_neg_count: 0,
  rate_distinct_count: 1,
  comment_count: 0,
  ...overrides,
});

const FEEDBACK: SessionFeedbackRow[] = [
  feedbackRow(),
  feedbackRow({ response_id: 'chatcmpl-b', rate_pos_count: 0, rate_zero_count: 1 }),
];

const RATINGS: SessionRatingCounts = {
  rating_up: 2,
  rating_down: 0,
  provable_down: 0,
  captured_form: 2,
  rate_events: 2,
};

// What the enrichment exposes on the instance under test. The rail decides whether to render the panel by
// asking whether the record carries any of these, so an empty list is how "this deployment has no insight
// enrichment" is expressed.
const INSIGHT_SCHEMA: AnalyticsEntityField[] = [
  { name: SessionsField.InsightTitle, source: 'title', type: AnalyticsFieldType.String },
  { name: SessionsField.InsightSummary, source: 'summary', type: AnalyticsFieldType.String },
  { name: SessionsField.InsightSentiment, source: 'sentiment', type: AnalyticsFieldType.Enum },
  { name: SessionsField.InsightResolutionStatus, source: 'resolution_status', type: AnalyticsFieldType.Enum },
  { name: SessionsField.InsightTopic, source: 'topic', type: AnalyticsFieldType.String },
  { name: SessionsField.InsightLanguage, source: 'language', type: AnalyticsFieldType.String },
];

const setup = (
  feedback: SessionFeedbackRow[] = FEEDBACK,
  total: number | null = feedback.length,
  ratings: SessionRatingCounts | null = RATINGS,
  session: SessionDetailRow = SESSION,
  isCommentTextReadable = false,
  schema: AnalyticsEntityField[] = INSIGHT_SCHEMA,
) =>
  render(
    <SessionDetailRail
      session={session}
      insightColumns={insightColumnsOf(schema)}
      feedback={feedback}
      feedbackTotal={total}
      ratings={ratings}
      isCommentTextReadable={isCommentTextReadable}
    />,
  );

const INSIGHTS: Partial<SessionDetailRow> = {
  [SessionsField.InsightTitle]: 'Rotating a shared API key',
  [SessionsField.InsightSummary]: 'The user asked how to rotate a shared key and confirmed the old one died.',
  [SessionsField.InsightSentiment]: 'neutral',
  [SessionsField.InsightResolutionStatus]: 'partially_resolved',
  [SessionsField.InsightTopic]: 'api keys',
  [SessionsField.InsightLanguage]: 'en',
};

const SOURCE_ENTITIES = [SESSIONS_ENTITY, FEEDBACK_ENTITY];

const PANEL_FRAMES = [...SESSION_DETAIL_PANELS, SESSION_INSIGHTS_PANEL, SESSION_FEEDBACK_PANEL];

describe('SessionDetailRail', () => {
  test('renders the usage, metadata and feedback panels', () => {
    setup();

    for (const key of [
      SessionsTraceI18nKey.DetailPanelUsage,
      SessionsTraceI18nKey.DetailPanelMetadata,
      SessionsTraceI18nKey.DetailPanelFeedback,
    ]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });

  // Every panel states the entity it read from, so no group of values on the page is unattributed.
  test('names the source each panel reads from', () => {
    setup();

    expect(screen.getAllByText(SESSIONS_ENTITY).length).toBeGreaterThan(0);
    expect(screen.getByText(FEEDBACK_ENTITY)).toBeInTheDocument();
  });

  // A panel's source is a catalog identifier, and an identifier names the entity the page queried — never an
  // enrichment, whose columns the service exposes through the entity it decorates. The insights panel is the
  // case that matters: it reads the enrichment and still names the entity.
  test('no panel claims an enrichment as its source', () => {
    for (const { sourceEntity } of PANEL_FRAMES) {
      expect(SOURCE_ENTITIES).toContain(sourceEntity);
      expect(sourceEntity).not.toBe('session_insights');
    }
  });

  test('the insights panel names the entity but takes the enrichment colour', () => {
    expect(SESSION_INSIGHTS_PANEL.sourceEntity).toBe(SESSIONS_ENTITY);
    expect(SESSION_INSIGHTS_PANEL.provenance).toBe(ColumnProvenance.Insights);
    expect(PROVENANCE_TEXT_CLASS[SESSION_INSIGHTS_PANEL.provenance]).not.toBe(
      PROVENANCE_TEXT_CLASS[ColumnProvenance.Sessions],
    );
  });

  test('an evaluated session renders the insights panel first', () => {
    setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, ...INSIGHTS });

    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

    expect(headings[0]).toContain(SessionsTraceI18nKey.DetailPanelInsights);
  });

  test('the insights panel states the evaluator reading without restating the title', () => {
    setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, ...INSIGHTS });

    expect(screen.getByText(INSIGHTS[SessionsField.InsightSummary] as string)).toBeInTheDocument();
    expect(screen.getByText('Partially resolved')).toBeInTheDocument();
    expect(screen.queryByText(INSIGHTS[SessionsField.InsightTitle] as string)).toBeNull();
  });

  test('an unevaluated session gets a statement rather than a panel of markers', () => {
    const unevaluated = INSIGHT_SCHEMA.reduce((record, { name }) => ({ ...record, [name]: null }), {
      ...SESSION,
    } as SessionDetailRow);
    setup(FEEDBACK, FEEDBACK.length, RATINGS, unevaluated);

    expect(screen.getByText(SessionsTraceI18nKey.DetailInsightsNotEvaluated)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailPanelInsights)).toBeNull();
  });

  // A record carrying none of the enrichment's columns is a deployment that does not have it — distinct
  // from a session it has not reached, which carries the columns with nothing in them.
  test('a deployment without the enrichment says so distinctly', () => {
    setup(FEEDBACK, FEEDBACK.length, RATINGS, SESSION, false, []);

    expect(screen.getByText(SessionsTraceI18nKey.DetailInsightsUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailInsightsNotEvaluated)).toBeNull();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailPanelInsights)).toBeNull();
  });

  test('the usage panel reports real token and cost values', () => {
    setup();

    expect(screen.getByText(SessionsTraceI18nKey.DetailTokensIn)).toBeInTheDocument();
    expect(screen.getByText('4.3 M')).toBeInTheDocument();
    expect(screen.getByText('70.2 K')).toBeInTheDocument();
    expect(screen.getByText('$10.8')).toBeInTheDocument();
  });

  test('the metadata panel states the trace ids the rollup carries', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.DetailTrace);

    expect(label.parentElement).toHaveTextContent('0a3f1d9c8b7e6a5f, 4c81be02d5aa77e1');
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  // The trace array is ordered by id rather than by turn, so numbering the entries would assert a sequence
  // the rollup does not record — and turn_count, not this array, is the count of record.
  test('the trace ids carry no turn numbering and no count', () => {
    setup();

    const row = screen.getByText(SessionsTraceI18nKey.DetailTrace).parentElement;

    expect(row).not.toHaveTextContent(SessionsTraceI18nKey.DetailTurn);
    expect(row?.textContent).not.toMatch(/\b2 trace/i);
  });

  // DIAL records no region at all, so the field is absent rather than permanently unavailable.
  test('the metadata panel presents no region field', () => {
    setup();

    expect(screen.queryByText('SessionsTrace.DetailRegion')).toBeNull();
  });

  // success_count counts a turn in which at least one hop succeeded, which is weaker than "the turn
  // succeeded" — the label has to say which.
  test('the successful-request field states what it counts', () => {
    setup();

    expect(screen.getByText(SessionsTraceI18nKey.DetailSuccessful)).toBeTruthy();
  });

  // The rollup carries the deployments, so marking the row unavailable would misreport data already fetched.
  test('the metadata panel states the deployments the rollup carries', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.DetailDeployment);

    expect(label.parentElement).toHaveTextContent('anthropic_switchyard-model, anthropic.claude-opus-4-8');
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  // A session that ran took time, so a recorded 0 means the backend never measured it. The grid states
  // the same thing about the same session.
  test('an unmeasured duration renders as the unavailable marker rather than as a zero', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.DetailDuration);

    expect(label.parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('a zero success count renders as a number, not as the unavailable marker', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.DetailSuccessful);
    expect(label.parentElement).toHaveTextContent('0');
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('an empty project renders its own empty presentation, not the marker', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.Project);
    expect(label.parentElement).toHaveTextContent(SessionsTraceI18nKey.DetailEmptyValue);
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('lists each rated response with its direction and its comment count', () => {
    setup();

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingPositive)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
    expect(screen.getAllByText(SessionsTraceI18nKey.DetailComment, { exact: false })).toHaveLength(2);
    expect(screen.getAllByText(SessionsTraceI18nKey.DetailNoComments)).toHaveLength(2);
  });

  test('states figures the listed rows do not add up to', () => {
    setup([feedbackRow()], 240, { ...RATINGS, rating_up: 37, rating_down: 4, provable_down: 4 });

    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('renders no figures at all when the aggregate failed', () => {
    setup(FEEDBACK, FEEDBACK.length, null);

    expect(screen.queryByText(SessionsTraceI18nKey.RatingUp)).toBeNull();
  });

  test('an unrated session states so rather than rendering an empty list', () => {
    setup([], 0);

    expect(screen.getByText(SessionsTraceI18nKey.DetailNoRatings)).toBeInTheDocument();
  });

  test('a truncated rating list declares itself partial', () => {
    setup(FEEDBACK, 6);

    expect(screen.getByText(SessionsTraceI18nKey.DetailFeedbackPartial)).toBeInTheDocument();
  });

  test('a complete rating list makes no partial claim', () => {
    setup(FEEDBACK, 2);

    expect(screen.queryByText(SessionsTraceI18nKey.DetailFeedbackPartial)).not.toBeInTheDocument();
  });

  // Both duration figures are wrong, in different ways: the sum double-counts nested hops, and the average is
  // per hop rather than per turn. The grid's Duration column used to carry the first caveat and no longer
  // exists, so this panel is the only surface stating either.
  test('each duration figure carries its own caveat', () => {
    setup();

    expect(screen.getByRole('button', { name: SessionsTraceI18nKey.DurationHint })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SessionsTraceI18nKey.AvgDurationHint })).toBeInTheDocument();
  });

  // A `<dt>` takes no focus, so a caveat attached to the label by hover alone never reaches a keyboard.
  test('a caveat is reachable by keyboard', async () => {
    setup();

    const hint = screen.getByRole('button', { name: SessionsTraceI18nKey.DurationHint });
    hint.focus();

    expect(hint).toHaveFocus();
  });

  test('a figure with nothing to qualify carries no caveat', () => {
    setup();

    expect(screen.queryByRole('button', { name: SessionsTraceI18nKey.DetailTotalTokens })).toBeNull();
  });

  // Every origin the view can render needs a colour, so a newly added source cannot render unstyled.
  test('every provenance maps to a colour', () => {
    for (const provenance of Object.values(ColumnProvenance)) {
      expect(PROVENANCE_TEXT_CLASS[provenance]).toBeTruthy();
    }
    for (const { provenance } of SESSION_DETAIL_PANELS) {
      expect(PROVENANCE_TEXT_CLASS[provenance]).toBeTruthy();
    }
  });
});
