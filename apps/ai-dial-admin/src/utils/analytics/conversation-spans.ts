import {
  MCP_EVENT_KIND,
  MCP_PROTOCOL_METHODS,
  MODEL_CALL_URI_MARKERS,
  ROUTE_EVENT_KIND,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationSpanRow, HopTextSuppression, SpanCategory } from '@/src/models/analytics/conversations-trace';
import { toNumber } from '@/src/utils/analytics/scalar';

const EMBEDDING_EVENT_KIND = 'embedding';
const LLM_CALL_EVENT_KIND = 'llm_call';

const EVENT_KIND_CATEGORY: Record<string, SpanCategory> = {
  [EMBEDDING_EVENT_KIND]: SpanCategory.Embedding,
  [MCP_EVENT_KIND]: SpanCategory.Retrieval,
  [ROUTE_EVENT_KIND]: SpanCategory.Route,
  [LLM_CALL_EVENT_KIND]: SpanCategory.Deployment,
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

export const spanCategoryOf = (span: ConversationSpanRow): SpanCategory => {
  if (span.success === false) {
    return SpanCategory.Error;
  }

  const mapped = EVENT_KIND_CATEGORY[span.event_kind?.trim() ?? ''];
  if (mapped) {
    return mapped;
  }

  return isModelCall(span) ? SpanCategory.Deployment : SpanCategory.Other;
};

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

export const hopTextSuppressionOf = (span: ConversationSpanRow): HopTextSuppression | null => {
  if (toNumber(span.response_body_bytes) === 0) {
    return HopTextSuppression.NoResponse;
  }

  if (isProtocolEnvelope(span)) {
    return HopTextSuppression.SessionSetup;
  }

  if (isEmbedding(span)) {
    return HopTextSuppression.Embedding;
  }

  return null;
};
