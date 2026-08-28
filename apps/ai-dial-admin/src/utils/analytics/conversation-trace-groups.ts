import { CONVERSATION_TRACE_ROOT_CAP } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationFeedbackRow,
  ConversationTraceCard,
  ConversationTraceChip,
  ConversationTraceFigureRow,
  ConversationTraceGroup,
  ConversationTracePageRow,
  ConversationTraceRootRow,
  RatingCounts,
} from '@/src/models/analytics/conversations-trace';
import { feedbackRowCounts } from '@/src/utils/analytics/conversation-detail-fields';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';

// A root recorded under a project other than the conversation's is one of Core's own service calls — title
// generation and similar. Core makes them under its own project while the client's rows carry the
// conversation's, so the projects differing is a categorical signal, not an inference from the request's size
// or shape.
//
// The comparison is relative on purpose: Core's project name is deployment configuration, and a hard-coded
// one would silently stop marking anything on an instance configured differently.
//
// The asymmetry in the blank handling is deliberate, and getting it wrong hides the marker on the shape it
// exists for. A blank on the **root** side is an absence — the row records no project, which says nothing
// about who called it — so it is not marked. A blank on the **conversation** side is still a real difference
// when the root names a project: chat conversations routinely carry no project at all while Core records its
// own service calls under `dial`, which is exactly the measured two-card shape. Requiring the conversation's
// project to be non-empty left that shape unmarked.
export const isCoreInternalRoot = (root: ConversationTraceRootRow, conversationProjectId: string): boolean => {
  const rootProject = root.project_id ?? '';

  return rootProject !== '' && rootProject !== conversationProjectId;
};

const hasConversationLabel = (root: ConversationTraceRootRow): boolean => (root.chat_id ?? '') !== '';

// A card is named by the deployment its call reached. A pass-through root records none — it records its
// endpoint instead — so the endpoint is the fallback rather than a placeholder, and the trace id stands in
// when the row carries neither. Shared with the drawer so the two cannot disagree about a card's name.
export const traceCardTitle = (card: ConversationTraceCard, traceId: string): string =>
  card.deployment || card.requestUri || traceId;

const cardOf = (root: ConversationTraceRootRow, conversationProjectId: string): ConversationTraceCard => ({
  traceId: root.trace_id,
  coreSpanId: root.core_span_id,
  startedAt: root.request_time,
  durationMs: root.operation_duration_ms,
  isSuccess: root.success,
  responseStatus: root.response_status,
  ownTokens: root.total_tokens,
  ownPrice: root.deployment_price,
  chainPrice: root.total_price,
  deployment: root.deployment,
  requestUri: root.request_uri,
  eventKind: root.event_kind,
  requestMessages: root.number_request_messages,
  hasConversationLabel: hasConversationLabel(root),
  isCoreInternal: isCoreInternalRoot(root, conversationProjectId),
});

// Earliest first, so a trace's own client call leads its cards and a service call recorded at the parent's
// completion follows it. Ties keep a stable order by span id rather than an arbitrary one.
const byRecordedTime = (a: ConversationTraceRootRow, b: ConversationTraceRootRow): number => {
  const left = toMillis(a.request_time);
  const right = toMillis(b.request_time);
  if (left === right) {
    return a.core_span_id.localeCompare(b.core_span_id);
  }

  return (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);
};

const groupBy = <T>(rows: T[], key: (row: T) => string): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const id = key(row);
    const bucket = grouped.get(id);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(id, [row]);
    }
  }

  return grouped;
};

// One chip per event kind the trace recorded, carrying its count. The kinds are whatever the data holds —
// `llm_call`, `embedding`, `mcp`, `route`, and the empty one, which is the unclassified pass-through rather
// than a marker for the entry call. The entry call is identified by identity in the roots pass.
const chipsOf = (figures: ConversationTraceFigureRow[]): ConversationTraceChip[] =>
  figures
    .map((row) => ({ eventKind: row.event_kind ?? '', spans: toNumber(row.spans) ?? 0 }))
    .filter(({ spans }) => spans > 0)
    .sort((a, b) => b.spans - a.spans || a.eventKind.localeCompare(b.eventKind));

const sum = (figures: ConversationTraceFigureRow[], read: (row: ConversationTraceFigureRow) => number): number =>
  figures.reduce((total, row) => total + read(row), 0);

// Assembles the page's three reads into what the listing renders.
//
// The figures are summed straight from their own pass with **no correction**: that pass is scoped by trace
// and carries no chat id, so a trace's span count, tokens and price are simply its own. Nothing here adds a
// root's value back into a total or increments a count for a row the conversation's own filter would have
// missed — there is no such row to compensate for.
export const traceGroupsOf = (
  pageRows: ConversationTracePageRow[],
  rootRows: ConversationTraceRootRow[],
  figureRows: ConversationTraceFigureRow[],
  conversationProjectId: string,
  rootCap: number = CONVERSATION_TRACE_ROOT_CAP,
): ConversationTraceGroup[] => {
  const rootsByTrace = groupBy(rootRows, ({ trace_id }) => trace_id);
  const figuresByTrace = groupBy(figureRows, ({ trace_id }) => trace_id);

  return pageRows.map((pageRow) => {
    const figures = figuresByTrace.get(pageRow.trace_id) ?? [];
    const roots = [...(rootsByTrace.get(pageRow.trace_id) ?? [])].sort(byRecordedTime);

    return {
      traceId: pageRow.trace_id,
      startedAt: pageRow.first_request_time,
      spans: sum(figures, (row) => toNumber(row.spans) ?? 0),
      tokens: sum(figures, (row) => toNumber(row.tokens) ?? 0),
      price: sum(figures, (row) => toNumber(row.price) ?? 0),
      failedSpans: sum(figures, (row) => toNumber(row.failed_spans) ?? 0),
      chips: chipsOf(figures),
      responseIds: [...new Set(figures.flatMap((row) => row.response_ids ?? []))].filter(Boolean),
      cards: roots.slice(0, rootCap).map((root) => cardOf(root, conversationProjectId)),
      // Disclosed rather than truncated in silence: the trace's own figures are not capped with its cards,
      // so a capped trace's totals legitimately exceed what is on screen and the reader has to be told why.
      elidedCardCount: Math.max(roots.length - rootCap, 0),
      isRootRecorded: roots.length > 0,
    };
  });
};

// Which card is the conversation's own call: the root carrying the chat id where one does, and otherwise the
// trace's sole client root. Both branches matter — the shape this listing exists for has no labelled root at
// all, so keying on the label alone answers "none" for exactly those traces.
//
// Trace-level facts (the ratings) attach to that one card. A trace with several candidates has none: stating
// a trace fact on two cards would present one fact as two, and the guards report that shape rather than the
// view guessing at it.
export const conversationCardId = (group: ConversationTraceGroup): string | null => {
  const labelled = group.cards.filter(({ hasConversationLabel }) => hasConversationLabel);
  if (labelled.length === 1) {
    return labelled[0].coreSpanId;
  }
  if (labelled.length > 1) {
    return null;
  }

  const clientRoots = group.cards.filter(({ isCoreInternal }) => !isCoreInternal);

  return clientRoots.length === 1 ? clientRoots[0].coreSpanId : null;
};

// Ratings attach to a trace by an exact join on the response id: the figures pass resolves the ids a trace
// recorded, and the rating source is grained by the same id.
//
// There is deliberately no fallback to time. Placing a rating on "the last trace that had started when it
// was submitted" is evaluated over the traces loaded so far, so under a paged listing a rating submitted
// after the last loaded trace attaches to that trace and then *moves* once the next page arrives. A figure
// that changes because the reader scrolled is worse than an absent one, so an unmatched rating is left
// unplaced here. It is not lost: the feedback panel's own figures come from a conversation-scoped aggregate
// rather than from what this attributed.
export const attributeRatingsToTraces = (
  groups: ConversationTraceGroup[],
  rows: ConversationFeedbackRow[],
): Map<string, RatingCounts> => {
  const traceByResponseId = new Map<string, string>();
  for (const group of groups) {
    for (const responseId of group.responseIds) {
      traceByResponseId.set(responseId, group.traceId);
    }
  }

  const counts = new Map<string, RatingCounts>();
  for (const row of rows) {
    const traceId = row.response_id ? traceByResponseId.get(row.response_id) : undefined;
    if (traceId === undefined) {
      continue;
    }

    const bucket = counts.get(traceId) ?? { rating_up: 0, rating_down: 0 };
    const { rating_up: up, rating_down: down } = feedbackRowCounts(row);
    counts.set(traceId, {
      rating_up: (bucket.rating_up ?? 0) + (up ?? 0),
      rating_down: (bucket.rating_down ?? 0) + (down ?? 0),
    });
  }

  return counts;
};

// The listing's correctness rests on properties of the recorded data that hold today and are not enforced by
// the source. Each is checked here rather than assumed, because a shape change turns an unchecked assumption
// into a silently wrong figure.
//
// A violation is *reported*, never resolved: nothing below picks one of the candidates. The caller logs it as
// a fault to investigate while the listing still renders, which is the honest outcome — the data is telling
// us something the design did not anticipate, and hiding that behind a guess is the failure mode being
// avoided.
export enum TraceInvariant {
  OneConversationPerTrace = 'one-conversation-per-trace',
  OneProjectAmongLabelledRoots = 'one-project-among-labelled-roots',
  AtMostOneCoreInternalRoot = 'at-most-one-core-internal-root',
  OneRootWhenNoneIsLabelled = 'one-root-when-none-is-labelled',
  LabellingAgreesWithMarker = 'labelling-agrees-with-marker',
}

export interface TraceInvariantViolation {
  invariant: TraceInvariant;
  traceId: string;
  detail: string;
}

const distinct = (values: Array<string | null>): string[] => [...new Set(values.map((v) => v ?? ''))].filter(Boolean);

// Checked over the root spans this page read. Child rows are not projected by the roots pass, so the
// conversation-per-trace check covers the roots alone — which is where a second conversation would have to
// surface for the listing to mis-attribute a card.
export const traceInvariantViolations = (
  rootRows: ConversationTraceRootRow[],
  conversationProjectId: string,
): TraceInvariantViolation[] => {
  const violations: TraceInvariantViolation[] = [];

  for (const [traceId, roots] of groupBy(rootRows, ({ trace_id }) => trace_id)) {
    const labelled = roots.filter(hasConversationLabel);
    const chatIds = distinct(roots.map(({ chat_id }) => chat_id));
    const coreInternal = roots.filter((root) => isCoreInternalRoot(root, conversationProjectId));

    if (chatIds.length > 1) {
      violations.push({
        invariant: TraceInvariant.OneConversationPerTrace,
        traceId,
        detail: `roots carry ${chatIds.length} distinct chat ids`,
      });
    }

    const labelledProjects = distinct(labelled.map(({ project_id }) => project_id));
    if (labelledProjects.length > 1) {
      violations.push({
        invariant: TraceInvariant.OneProjectAmongLabelledRoots,
        traceId,
        detail: `labelled roots carry ${labelledProjects.length} distinct projects`,
      });
    }

    if (coreInternal.length > 1) {
      violations.push({
        invariant: TraceInvariant.AtMostOneCoreInternalRoot,
        traceId,
        detail: `${coreInternal.length} roots are recorded under another project`,
      });
    }

    const candidates = roots.filter((root) => !isCoreInternalRoot(root, conversationProjectId));
    if (!labelled.length && candidates.length > 1) {
      violations.push({
        invariant: TraceInvariant.OneRootWhenNoneIsLabelled,
        traceId,
        detail: `no root carries the conversation header and ${candidates.length} roots could be the client call`,
      });
    }

    // The shape that would split the labelling rule from the marker: a labelled root alongside another root
    // that the marker leaves unmarked, so "the conversation's own call" has two candidates and neither rule
    // can settle it. No such trace is recorded, which is why this is guarded rather than relied upon.
    const unmarkedUnlabelled = roots.filter(
      (root) => !hasConversationLabel(root) && !isCoreInternalRoot(root, conversationProjectId),
    );
    if (labelled.length && unmarkedUnlabelled.length) {
      violations.push({
        invariant: TraceInvariant.LabellingAgreesWithMarker,
        traceId,
        detail: `a labelled root sits beside ${unmarkedUnlabelled.length} unlabelled root(s) under the conversation's own project`,
      });
    }
  }

  return violations;
};
