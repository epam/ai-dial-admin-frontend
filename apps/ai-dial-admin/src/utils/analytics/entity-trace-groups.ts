import { EntityCallRow, EntityTraceCursor } from '@/src/models/analytics/entity-traces';
import { SessionTraceCard, SessionTraceFigureRow, SessionTraceGroup } from '@/src/models/analytics/sessions-trace';
import { toMillis } from '@/src/utils/analytics/session-formatting';
import { traceFiguresOf } from '@/src/utils/analytics/session-trace-groups';

const cardKey = (card: Pick<SessionTraceCard, 'traceId' | 'coreSpanId'>): string =>
  `${card.traceId}:${card.coreSpanId}`;

// Neither session-only fact applies: the call carries no session label to look for, and the system-request
// marker compares against a session's project the entity listing does not have.
const cardOf = (row: EntityCallRow): SessionTraceCard => ({
  traceId: row.trace_id,
  coreSpanId: row.core_span_id,
  startedAt: row.request_time,
  durationMs: row.operation_duration_ms,
  isSuccess: row.success,
  responseStatus: row.response_status,
  ownTokens: row.total_tokens,
  ownPrice: row.deployment_price,
  chainPrice: row.total_price,
  deployment: row.deployment,
  requestUri: row.request_uri,
  eventKind: row.event_kind,
  requestMessages: row.number_request_messages,
  hasSessionLabel: false,
  isCoreInternal: false,
  caller: row.parent_deployment ?? null,
  projectId: row.project_id ?? null,
});

/**
 * A page's calls as trace groups, in the order the calls arrived — newest first — with each trace's calls as
 * its cards. The trace tier's figures come from the figures pass, scoped by trace, so they are the trace's own
 * rather than the entity's share of it.
 */
export const entityTraceGroupsOf = (
  callRows: EntityCallRow[],
  figureRows: SessionTraceFigureRow[],
): SessionTraceGroup[] => {
  const groups = new Map<string, SessionTraceGroup>();

  for (const row of callRows) {
    const existing = groups.get(row.trace_id);

    if (existing) {
      existing.cards.push(cardOf(row));
      continue;
    }

    groups.set(row.trace_id, {
      traceId: row.trace_id,
      startedAt: row.request_time,
      ...traceFiguresOf(figureRows.filter(({ trace_id }) => trace_id === row.trace_id)),
      cards: [cardOf(row)],
      elidedCardCount: 0,
      isRootRecorded: true,
    });
  }

  return [...groups.values()];
};

/** The call the next page is read after: the page's last row, or none for an empty page. */
export const entityTraceCursorOf = (callRows: EntityCallRow[]): EntityTraceCursor | null => {
  const last = callRows.at(-1);
  const requestTime = toMillis(last?.request_time ?? null);

  return last && requestTime !== null ? { requestTime, coreSpanId: last.core_span_id } : null;
};

/**
 * Appends a page to what is already shown. A trace that straddles the page boundary gains its later calls as
 * further cards under the group already on screen, with the newer figures read; a call already shown is
 * discarded, so a tie at the boundary never shows one call twice.
 */
export const mergeEntityTraceGroups = (shown: SessionTraceGroup[], page: SessionTraceGroup[]): SessionTraceGroup[] => {
  const seen = new Set(shown.flatMap(({ cards }) => cards.map(cardKey)));
  const merged = new Map(shown.map((group) => [group.traceId, group]));

  for (const group of page) {
    const cards = group.cards.filter((card) => !seen.has(cardKey(card)));

    if (!cards.length) {
      continue;
    }

    cards.forEach((card) => seen.add(cardKey(card)));

    const existing = merged.get(group.traceId);
    merged.set(
      group.traceId,
      existing
        ? { ...existing, ...group, startedAt: existing.startedAt, cards: [...existing.cards, ...cards] }
        : { ...group, cards },
    );
  }

  return [...merged.values()];
};
