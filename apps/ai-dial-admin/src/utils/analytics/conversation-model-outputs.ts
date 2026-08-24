import {
  STREAM_MODEL_BODY_BYTE_BUDGET,
  STREAM_MODEL_BODY_LIMIT,
  TOOL_ARGUMENTS_PREVIEW_LIMIT,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationModelBodyRow,
  ConversationSpanRow,
  ModelCallOutput,
  ModelToolRequest,
} from '@/src/models/analytics/conversations-trace';
import { assistantTextOf, toolCallRequestsOf } from '@/src/utils/analytics/conversation-bodies';
import { toNumber } from '@/src/utils/analytics/scalar';

const previewOf = (raw: string | null): string | null => {
  const text = raw?.trim();
  if (!text) {
    return null;
  }

  return text.length > TOOL_ARGUMENTS_PREVIEW_LIMIT ? `${text.slice(0, TOOL_ARGUMENTS_PREVIEW_LIMIT)}…` : text;
};

export const modelOutputOf = (row: ConversationModelBodyRow): ModelCallOutput => {
  const toolCalls: ModelToolRequest[] = toolCallRequestsOf(row.response_body).map(({ name, args }) => ({
    name,
    argumentsPreview: previewOf(args),
  }));

  return {
    core_span_id: row.core_span_id,
    text: assistantTextOf(row) || null,
    toolCalls,
    isUnread: false,
  };
};

export const splitModelBodyBudget = (
  hops: ConversationSpanRow[],
): { read: ConversationSpanRow[]; skipped: ConversationSpanRow[] } => {
  const read: ConversationSpanRow[] = [];
  const skipped: ConversationSpanRow[] = [];
  let bytes = 0;

  for (const hop of hops) {
    const size = toNumber(hop.response_body_bytes) ?? 0;
    const isAffordable = read.length < STREAM_MODEL_BODY_LIMIT && bytes + size <= STREAM_MODEL_BODY_BYTE_BUDGET;

    if (isAffordable) {
      bytes += size;
      read.push(hop);
    } else {
      skipped.push(hop);
    }
  }

  return { read, skipped };
};

export const unreadOutputOf = ({ core_span_id }: ConversationSpanRow): ModelCallOutput => ({
  core_span_id,
  text: null,
  toolCalls: [],
  isUnread: true,
});
