import {
  HTTP_REASON_PHRASE,
  MCP_EVENT_KIND,
  MCP_NOTIFICATION_PREFIX,
  MODEL_CALL_URI_MARKERS,
  RATE_URI_SUFFIX,
  ROUTE_EVENT_KIND,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  HopFacts,
  HopFactsShape,
  HopSideSuppression,
  HopSideSuppressions,
  HopTransport,
  McpToolCallTally,
  SpanBodyTab,
  SpanKind,
  HopBodyGrants,
} from '@/src/models/analytics/conversations-trace';
import { toNumber } from '@/src/utils/analytics/scalar';

const EMBEDDING_EVENT_KIND = 'embedding';
const LLM_CALL_EVENT_KIND = 'llm_call';
const FAILED_STATUS_FLOOR = 400;

const EVENT_KIND_TO_KIND: Record<string, SpanKind> = {
  [EMBEDDING_EVENT_KIND]: SpanKind.Embeddings,
  [MCP_EVENT_KIND]: SpanKind.Mcp,
  [ROUTE_EVENT_KIND]: SpanKind.Route,
  [LLM_CALL_EVENT_KIND]: SpanKind.Llm,
};

export const isEmbedding = ({ event_kind }: ConversationSpanRow): boolean =>
  event_kind?.trim() === EMBEDDING_EVENT_KIND;

export const isMcpCall = ({ event_kind }: ConversationSpanRow): boolean => event_kind?.trim() === MCP_EVENT_KIND;

// The path only, so a query string can never decide the kind: the suffix is anchored at the end, and a rating
// endpoint carries none.
const pathOf = (requestUri: string | null): string => (requestUri?.trim() ?? '').split('?')[0];

export const isRating = ({ request_uri }: ConversationSpanRow): boolean =>
  pathOf(request_uri).endsWith(RATE_URI_SUFFIX);

export const isModelCall = ({ event_kind, request_uri }: ConversationSpanRow): boolean => {
  const kind = event_kind?.trim();
  if (kind === LLM_CALL_EVENT_KIND) {
    return true;
  }
  if (kind) {
    return false;
  }

  const uri = request_uri?.trim() ?? '';
  return MODEL_CALL_URI_MARKERS.some((marker) => uri.includes(marker));
};

// What kind of call the hop was, and nothing about how it went. The failure branch that used to short-circuit
// this function is gone: it made a failed model call report its failure *instead of* its kind, so a reader
// lost the fact they were about to act on — a failed tool call and a failed model call are different
// problems. Failure is answered by `isFailedHop`, beside this, never in place of it.
//
// The rating test runs before the `event_kind` map so the kind is not decided by an `event_kind` a rating
// never carries — the map would miss it and the model-call fallback would type it generically.
export const spanKindOf = (span: ConversationSpanRow): SpanKind => {
  if (isRating(span)) {
    return SpanKind.Rating;
  }

  const mapped = EVENT_KIND_TO_KIND[span.event_kind?.trim() ?? ''];
  if (mapped) {
    return mapped;
  }

  return isModelCall(span) ? SpanKind.Llm : SpanKind.Other;
};

// A failure is either a false success flag or a status of 400 or above. It lives beside the kind rather than
// inside the stream builder because both the badge and the tree now ask it, and two copies of this test would
// let them drift apart on what counts as failed.
export const isFailedHop = ({ success, response_status }: ConversationSpanRow): boolean =>
  success === false || (toNumber(response_status) ?? 0) >= FAILED_STATUS_FLOOR;

// Who did the work. Deployment first, deliberately: the previous order preferred the MCP method, which left
// two protocol messages of different servers in the same second indistinguishable. What the hop *did* is a
// separate field — see `spanPhaseOf` — so a row states both rather than choosing one.
export const spanLabelOf = ({ deployment, request_uri, core_span_id }: ConversationSpanRow): string =>
  deployment?.trim() || request_uri?.trim() || core_span_id;

// What the hop did, where its kind records one. The tool it called answers first, since that is what a reader
// opening a retrieval hop is looking for; the protocol method answers when no tool was called.
export const spanPhaseOf = ({ mcp_tool_call_name, mcp_method }: ConversationSpanRow): string | null =>
  mcp_tool_call_name?.trim() || mcp_method?.trim() || null;

export const areSpansPartial = (spans: ConversationSpanRow[], hopCount: number | null): boolean =>
  hopCount !== null && hopCount > spans.length;

// Any MCP hop that called no tool. By the absent call rather than by a list of known methods: one outside
// such a list fell through to the tool-call reader, whose single shape it does not answer in, and rendered
// empty.
export const isProtocolEnvelope = ({ mcp_tool_call_name }: ConversationSpanRow): boolean => !mcp_tool_call_name?.trim();

// The one protocol message answered with no body. By prefix: the set a server sends is not ours to fix.
export const isProtocolNotification = ({ mcp_method, mcp_tool_call_name }: ConversationSpanRow): boolean =>
  !mcp_tool_call_name?.trim() && (mcp_method?.trim() ?? '').startsWith(MCP_NOTIFICATION_PREFIX);

// `hasFailed` is `isFailedHop`, not a second test: a 202, or a status this map does not name, has to read the
// same here as in the tree.
export const hopTransportOf = (span: ConversationSpanRow): HopTransport => {
  const status = toNumber(span.response_status);

  return {
    method: span.request_method?.trim() || null,
    status,
    reason: status === null ? null : (HTTP_REASON_PHRASE[status] ?? null),
    hasFailed: isFailedHop(span),
    requestBytes: toNumber(span.request_body_bytes),
    responseBytes: toNumber(span.response_body_bytes),
    durationMs: toNumber(span.operation_duration_ms),
  };
};

// Which figures the row states, decided by what the hop recorded rather than by what kind of call it was.
// A hop that metered nothing of its own — every MCP and route hop, and every application hop, which spends
// only through the calls it makes — has a duration and a chain price and no tokens, so stating tokens for it
// prints a zero and a dash where the reader expects its most important figure.
//
// `null` where the hop recorded neither: a model call can record zero tokens, no price of its own and no
// chain price, and there is then nothing to state. Answering an empty shape instead pushed the decision onto
// the row, which rendered a blank line under the hop's name.
export const hopFactsOf = (span: ConversationSpanRow): HopFacts | null => {
  const tokens = toNumber(span.total_tokens);
  const ownCost = toNumber(span.deployment_price);

  if ((tokens ?? 0) > 0 || (ownCost ?? 0) > 0) {
    return {
      shape: HopFactsShape.Metered,
      // Never a zero. A span can record a real own price against zero tokens, and `0 tok` beside that price
      // is the same broken reading the unmetered shape exists to avoid — absent, not zero, is the fact.
      tokens: (tokens ?? 0) > 0 ? tokens : null,
      requestMessages: toNumber(span.number_request_messages),
      cost: span.deployment_price,
    };
  }

  const chainCost = toNumber(span.total_price);

  return (chainCost ?? 0) > 0 ? { shape: HopFactsShape.Unmetered, chainCost: span.total_price ?? null } : null;
};

// How many times the turn recorded an MCP call to each tool, and whether that count is the whole truth.
// `isComplete` is not decoration: the span read is capped, and a `tools/call` past the bound would make an
// absence look real when it is only unread — so a bounded read answers nothing rather than answering wrongly.
export const mcpToolCallTallyOf = (spans: ConversationSpanRow[], isComplete: boolean): McpToolCallTally => {
  const counts: Record<string, number> = {};

  for (const span of spans) {
    const name = span.mcp_tool_call_name?.trim();
    if (isMcpCall(span) && name) {
      counts[name] = (counts[name] ?? 0) + 1;
    }
  }

  return { counts, isComplete };
};

// Which of the tools a response asked for the turn recorded no MCP call of. Resolved by count per name and
// never by identity — nothing in the log says which specific request went unanswered, so no claim is made
// about one. A name asked for twice and recorded once leaves one unanswered, not two and not none.
//
// Nothing at all on a bounded read: the note this feeds states a *cause* — that the calling application ran
// the tool itself — and that cause is only sound when every span of the turn was read.
export const unansweredToolNamesOf = (requested: string[], tally: McpToolCallTally): string[] => {
  if (!tally.isComplete) {
    return [];
  }

  const seen: Record<string, number> = {};
  const unanswered: string[] = [];

  for (const name of requested) {
    seen[name] = (seen[name] ?? 0) + 1;
    if (seen[name] > (tally.counts[name] ?? 0)) {
      unanswered.push(name);
    }
  }

  return unanswered;
};

// Whether a side has anything worth fetching, decided from the hop row before any body read — and decided
// per side, because the two questions are not the same one. A hop that returned nothing still sent something,
// and its request is the only record of what it attempted; suppressing it whole, as the previous per-hop rule
// did, withheld exactly the case a reader most wants opened.
//
// The protocol methods used to settle both sides on the claim that they carry no content. They do carry it,
// so only a notification — answered with no body at all — still settles its response side.
export const hopSideSuppressionsOf = (span: ConversationSpanRow): HopSideSuppressions => {
  if (isProtocolNotification(span)) {
    return { request: null, response: HopSideSuppression.ProtocolNoBody };
  }

  if (toNumber(span.response_body_bytes) === 0) {
    return { request: null, response: HopSideSuppression.NoResponse };
  }

  // Only the response is a vector. The request averages 352 B and is the probe text — the half a reader
  // opening an embedding hop is actually asking about.
  if (isEmbedding(span)) {
    return { request: null, response: HopSideSuppression.Vector };
  }

  return { request: null, response: null };
};

// Which tabs the bodies section offers for one hop, in the order they are always presented. Decided from the
// hop row and the caller's column grants alone — before any body read — so the tab strip, the reads it
// enables and the panels it renders cannot disagree about what this hop has.
//
// Request and Response are gated by their own column and by nothing else. A *suppressed* side still gets its
// tab: a hop that returned nothing still sent something, and the tab is where the absence is stated.
//
// Chat is gated by the request column, because the history is what it is made of, and is withheld from the
// two kinds that record no history at all. The test is a deny-list, so an event kind this frontend does not
// recognise keeps its Chat tab and states its own emptiness if the dialect turns out to carry no message.
export const spanBodyTabsOf = (span: ConversationSpanRow, grants: HopBodyGrants): SpanBodyTab[] => {
  const kind = spanKindOf(span);
  const hasHistory = kind !== SpanKind.Mcp && kind !== SpanKind.Embeddings;

  return [
    ...(grants.isRequestReadable ? [SpanBodyTab.Request] : []),
    ...(grants.isResponseReadable ? [SpanBodyTab.Response] : []),
    ...(grants.isRequestReadable && hasHistory ? [SpanBodyTab.Chat] : []),
  ];
};
