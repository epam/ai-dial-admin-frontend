import {
  MCP_EVENT_KIND,
  MCP_PROTOCOL_METHODS,
  MODEL_CALL_URI_MARKERS,
  ROUTE_EVENT_KIND,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  HopSideSuppression,
  HopSideSuppressions,
  SpanKind,
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
// problems. Failure is answered by `isFailedSpan`, beside this, never in place of it.
export const spanKindOf = (span: ConversationSpanRow): SpanKind => {
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

export const spanLabelOf = ({
  deployment,
  request_uri,
  core_span_id,
  mcp_tool_call_name,
  mcp_method,
}: ConversationSpanRow): string =>
  mcp_tool_call_name?.trim() || mcp_method?.trim() || deployment?.trim() || request_uri?.trim() || core_span_id;

export const areSpansPartial = (spans: ConversationSpanRow[], hopCount: number | null): boolean =>
  hopCount !== null && hopCount > spans.length;

export const isProtocolEnvelope = ({ mcp_method, mcp_tool_call_name }: ConversationSpanRow): boolean =>
  !mcp_tool_call_name?.trim() && MCP_PROTOCOL_METHODS.includes(mcp_method?.trim() ?? '');

// Whether a side has anything worth fetching, decided from the hop row before any body read — and decided
// per side, because the two questions are not the same one. A hop that returned nothing still sent something,
// and its request is the only record of what it attempted; suppressing it whole, as the previous per-hop rule
// did, withheld exactly the case a reader most wants opened. Only the protocol-envelope methods still settle
// both sides at once: they negotiate a session and carry no content either way.
export const hopSideSuppressionsOf = (span: ConversationSpanRow): HopSideSuppressions => {
  if (isProtocolEnvelope(span)) {
    return { request: HopSideSuppression.SessionSetup, response: HopSideSuppression.SessionSetup };
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
