import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  SpanFieldGroup,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { insightColumnsOf } from '@/src/utils/analytics/session-insights';

vi.mock('@/src/components/Common/FullscreenViewer/FullscreenViewer', () => ({
  default: ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
    <div role="dialog" aria-label={title}>
      <pre>{content}</pre>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

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

const field = (name: string, type: AnalyticsFieldType, tag: string) => ({ name, label: name, type, tag });

// The groups the server derives for the metadata block: the record's own fields under the schema's tags.
const METADATA_GROUPS: SpanFieldGroup[] = [
  {
    tag: 'identity',
    fields: [
      field('client_session_id', AnalyticsFieldType.String, 'identity'),
      field('first_request_time', AnalyticsFieldType.Timestamp, 'identity'),
      field('traces', AnalyticsFieldType.Array, 'identity'),
    ],
  },
  {
    tag: 'principal',
    fields: [
      field('project_id', AnalyticsFieldType.String, 'principal'),
      field('user_hash', AnalyticsFieldType.String, 'principal'),
    ],
  },
  { tag: 'response', fields: [field('success_count', AnalyticsFieldType.Long, 'response')] },
  { tag: 'deployment', fields: [field('deployments', AnalyticsFieldType.Array, 'deployment')] },
];

const openGroup = async (name: RegExp | string) =>
  userEvent.setup().click(screen.getByRole('button', { name, expanded: false }));

const setup = (
  feedback: SessionFeedbackRow[] = FEEDBACK,
  total: number | null = feedback.length,
  ratings: SessionRatingCounts | null = RATINGS,
  session: SessionDetailRow = SESSION,
  isCommentTextReadable = false,
  schema: AnalyticsEntityField[] = INSIGHT_SCHEMA,
  metadataGroups: SpanFieldGroup[] = METADATA_GROUPS,
) =>
  render(
    <SessionDetailRail
      session={session}
      insightColumns={insightColumnsOf(schema)}
      metadataGroups={metadataGroups}
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
    expect(screen.queryByText(/total tokens/i)).toBeNull();
  });

  describe('cache hit', () => {
    const cacheHitValue = () =>
      screen.getByText(SessionsTraceI18nKey.DetailCacheHit).closest('div')?.querySelector('dd')?.textContent;

    test('states the cached share of the prompt tokens', () => {
      setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, prompt_tokens: 1000, cached_prompt_tokens: 250 });

      expect(cacheHitValue()).toBe('25%');
    });

    test('states a reported zero as a miss', () => {
      setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, cached_prompt_tokens: 0 });

      expect(cacheHitValue()).toBe('0%');
    });

    test('marks an unreported cached count as unavailable rather than a miss', () => {
      setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, cached_prompt_tokens: null });

      expect(cacheHitValue()).toBe(UNAVAILABLE_VALUE);
    });

    test('marks the figure unavailable where the instance has no cached-token column', () => {
      setup();

      expect(cacheHitValue()).toBe(UNAVAILABLE_VALUE);
    });

    test('carries a keyboard-reachable caveat', () => {
      setup();

      expect(screen.getByRole('button', { name: SessionsTraceI18nKey.CacheHitHint })).toBeInTheDocument();
    });
  });

  test('the metadata panel states the trace ids the rollup carries', async () => {
    setup();
    await openGroup(/identity/i);

    const row = screen.getByText(SessionsTraceI18nKey.DetailTrace).parentElement;

    expect(row).toHaveTextContent('0a3f1d9c8b7e6a5f, 4c81be02d5aa77e1');
    expect(row).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  // The trace array is ordered by id rather than by turn, so numbering the entries would assert a sequence
  // the rollup does not record — and turn_count, not this array, is the count of record.
  test('the trace ids carry no turn numbering and no count', async () => {
    setup();
    await openGroup(/identity/i);

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
  test('the successful-request field states what it counts', async () => {
    setup();
    await openGroup(/response/i);

    expect(screen.getByText(SessionsTraceI18nKey.DetailSuccessful)).toBeTruthy();
  });

  // The rollup carries the deployments, so marking the row unavailable would misreport data already fetched.
  test('the metadata panel states the deployments the rollup carries', async () => {
    setup();
    await openGroup(/deployment/i);

    const row = screen.getByText(SessionsTraceI18nKey.DetailDeployment).parentElement;

    expect(row).toHaveTextContent('anthropic_switchyard-model, anthropic.claude-opus-4-8');
    expect(row).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('a metadata row keeps the label this view gives its column', async () => {
    setup();
    await openGroup(/identity/i);

    expect(screen.getByText(SessionsTraceI18nKey.Session)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.DetailStarted)).toBeInTheDocument();
  });

  // A session that ran took time, so a recorded 0 means the backend never measured it. The grid states
  // the same thing about the same session.
  test('an unmeasured duration renders as the unavailable marker rather than as a zero', () => {
    setup();

    const label = screen.getByText(SessionsTraceI18nKey.DetailDuration);

    expect(label.parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('a zero success count renders as a number, not as the unavailable marker', async () => {
    setup();
    await openGroup(/response/i);

    const row = screen.getByText(SessionsTraceI18nKey.DetailSuccessful).parentElement;

    expect(row).toHaveTextContent('0');
    expect(row).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('an empty project renders the unavailable marker', async () => {
    setup();
    await openGroup(/principal/i);

    expect(screen.getByText(SessionsTraceI18nKey.Project).parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
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

    expect(screen.queryByRole('button', { name: SessionsTraceI18nKey.DetailTokensIn })).toBeNull();
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

describe('SessionDetailRail — metadata groups', () => {
  const GROUPS: SpanFieldGroup[] = [
    {
      tag: 'client',
      fields: [
        field('client_type', AnalyticsFieldType.String, 'client'),
        field('client_types', AnalyticsFieldType.Array, 'client'),
      ],
    },
    { tag: 'token-usage', fields: [field('reasoning_tokens', AnalyticsFieldType.Long, 'token-usage')] },
  ];
  const SESSION_WITH_GROUPS = {
    ...SESSION,
    client_type: 'claudecode',
    client_types: ['chat', 'claudecode'],
  } as SessionDetailRow;

  const setupGroups = (session: SessionDetailRow = SESSION_WITH_GROUPS, groups: SpanFieldGroup[] = GROUPS) =>
    setup(FEEDBACK, FEEDBACK.length, RATINGS, session, false, INSIGHT_SCHEMA, groups);

  test('previews the caller group by the user name, and by its first field where there is none', () => {
    const principal: SpanFieldGroup = {
      tag: 'principal',
      fields: [
        field('auth_types', AnalyticsFieldType.Array, 'principal'),
        field('user_display_name', AnalyticsFieldType.String, 'principal'),
      ],
    };
    const { unmount } = setup(
      FEEDBACK,
      FEEDBACK.length,
      RATINGS,
      { ...SESSION, auth_types: ['jwt'], user_display_name: 'Ada Lovelace' } as SessionDetailRow,
      false,
      INSIGHT_SCHEMA,
      [principal],
    );

    expect(screen.getByRole('button', { name: /principal/i })).toHaveTextContent('Ada Lovelace');
    unmount();

    setup(
      FEEDBACK,
      FEEDBACK.length,
      RATINGS,
      { ...SESSION, auth_types: ['api_key'], user_display_name: null } as SessionDetailRow,
      false,
      INSIGHT_SCHEMA,
      [principal],
    );

    expect(screen.getByRole('button', { name: /principal/i })).toHaveTextContent('api_key');
  });

  test('renders every group inside the one Metadata panel', () => {
    setupGroups();

    expect(screen.getAllByRole('heading', { name: SessionsTraceI18nKey.DetailPanelMetadata })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /client/i })).toBeInTheDocument();
  });

  test('renders one collapsed group per reported tag', () => {
    setupGroups();

    expect(screen.getByRole('button', { name: /client/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: SessionsTraceI18nKey.SpanTagTokenUsage })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('client_type')).toBeNull();
  });

  test('opens one group at a time and states its fields from the record', async () => {
    const user = userEvent.setup();
    setupGroups();

    await user.click(screen.getByRole('button', { name: /client/i }));

    expect(screen.getByText('client_type')).toBeInTheDocument();
    expect(screen.getByText('claudecode')).toBeInTheDocument();
    expect(screen.getByText('chat, claudecode')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: SessionsTraceI18nKey.SpanTagTokenUsage }));

    expect(screen.queryByText('client_type')).toBeNull();
    expect(screen.getByText('reasoning_tokens')).toBeInTheDocument();
  });

  test('states a reported zero in a token group rather than marking it unavailable', async () => {
    setup(
      FEEDBACK,
      FEEDBACK.length,
      RATINGS,
      { ...SESSION, reasoning_tokens: 0 } as SessionDetailRow,
      false,
      INSIGHT_SCHEMA,
      [{ tag: 'token-usage', fields: [field('reasoning_tokens', AnalyticsFieldType.Long, 'token-usage')] }],
    );
    await openGroup(SessionsTraceI18nKey.SpanTagTokenUsage);

    const row = screen.getByText('reasoning_tokens').parentElement;

    expect(row).toHaveTextContent('0');
    expect(row).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('marks a field the record lacks as unavailable', async () => {
    setupGroups(SESSION);
    await openGroup(/client/i);

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(0);
  });

  test('says the schema could not be read where there are no groups, and keeps the JSON control', () => {
    setupGroups(SESSION, []);

    expect(screen.getByText(SessionsTraceI18nKey.DetailFieldsUnavailable)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SessionsTraceI18nKey.SessionJsonOpen })).toBeInTheDocument();
  });
});

describe('SessionDetailRail — copy and JSON', () => {
  const writeText = vi.fn();

  // Installed at the click: opening a group goes through `userEvent.setup()`, which replaces the clipboard
  // with its own stub, so a stub installed earlier would never see the copy.
  const copy = (label: string) => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: `copy ${label}` }));

    return writeText.mock.lastCall?.[0];
  };

  test('copies the full value of a row', async () => {
    setup();
    await openGroup(/identity/i);

    expect(copy(SessionsTraceI18nKey.Session)).toBe(SESSION.client_session_id);
  });

  test('copies a list value as its items separated by a comma and a space', async () => {
    setup();
    await openGroup(/deployment/i);

    expect(copy(SessionsTraceI18nKey.DetailDeployment)).toBe(SESSION.deployments?.join(', '));
  });

  test('offers no copy control on a row with no value', async () => {
    setup();
    await openGroup(/principal/i);

    expect(screen.queryByRole('button', { name: `copy ${SessionsTraceI18nKey.Project}` })).toBeNull();
  });

  test('offers no copy control on the insights panel', () => {
    setup(FEEDBACK, FEEDBACK.length, RATINGS, { ...SESSION, ...INSIGHTS } as SessionDetailRow);

    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'copy Sentiment' })).toBeNull();
  });

  test('opens the whole record as JSON, keyed by the published names and without a read', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockClear();
    setup();

    await user.click(screen.getByRole('button', { name: SessionsTraceI18nKey.SessionJsonOpen }));

    const dump = screen.getByRole('dialog').querySelector('pre')?.textContent ?? '';

    expect(JSON.parse(dump)).toEqual(SESSION);
    expect(Object.keys(JSON.parse(dump))).toEqual(Object.keys(SESSION));
    expect(fetch).not.toHaveBeenCalled();
  });

  test('closes the dump', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: SessionsTraceI18nKey.SessionJsonOpen }));
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
