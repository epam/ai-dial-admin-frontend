import { ROUTE_EVENT_KIND, UTILITY_URI_MARKERS } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  HopEventSeed,
  HopEventType,
  HopTreeNode,
  ModelCallOutput,
} from '@/src/models/analytics/conversations-trace';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';
import {
  isEmbedding,
  isMcpCall,
  isModelCall,
  isProtocolEnvelope,
  spanLabelOf,
} from '@/src/utils/analytics/conversation-spans';
import { buildSpanTree } from '@/src/utils/analytics/conversation-span-tree';
import { toNumber } from '@/src/utils/analytics/scalar';

const HTTP_ERROR_STATUS = 400;

export const isConversationHop = (span: ConversationSpanRow): boolean => span.event_kind?.trim() !== ROUTE_EVENT_KIND;

const isUtility = ({ request_uri }: ConversationSpanRow): boolean => {
  const uri = request_uri?.trim() ?? '';
  return UTILITY_URI_MARKERS.some((marker) => uri.includes(marker));
};

export const isFailedHop = ({ success, response_status }: ConversationSpanRow): boolean =>
  success === false || (toNumber(response_status) ?? 0) >= HTTP_ERROR_STATUS;

const byStartTime = (left: ConversationSpanRow, right: ConversationSpanRow): number =>
  (toMillis(left.request_time) ?? 0) - (toMillis(right.request_time) ?? 0);

const eventsForHop = (span: ConversationSpanRow, output: ModelCallOutput | undefined): HopEventSeed[] => {
  const reasoningTokens = toNumber(span.reasoning_tokens);
  const base = { span };

  if (isFailedHop(span)) {
    return [
      {
        ...base,
        type: HopEventType.Error,
        label: spanLabelOf(span),
        detail: span.response_status === null ? null : String(span.response_status),
      },
    ];
  }

  if (isEmbedding(span)) {
    return [{ ...base, type: HopEventType.Embedding, label: spanLabelOf(span) }];
  }

  if (isMcpCall(span)) {
    return isProtocolEnvelope(span)
      ? [{ ...base, type: HopEventType.Session, label: span.mcp_method?.trim() || spanLabelOf(span) }]
      : [{ ...base, type: HopEventType.ToolResult, label: spanLabelOf(span) }];
  }

  if (isModelCall(span) && !isUtility(span)) {
    const seeds: HopEventSeed[] = [];

    if (reasoningTokens !== null && reasoningTokens > 0) {
      seeds.push({ ...base, type: HopEventType.Thinking, label: spanLabelOf(span), reasoningTokens });
    }

    // A hop the log records as having returned no bytes is known to be empty, so it must not read as one
    // whose body simply went unread.
    if (toNumber(span.response_body_bytes) === 0) {
      if (!seeds.length) {
        seeds.push({ ...base, type: HopEventType.Empty, label: spanLabelOf(span) });
      }
      return seeds;
    }

    if (!output || output.isUnread) {
      seeds.push({ ...base, type: HopEventType.Other, label: spanLabelOf(span) });
      return seeds;
    }

    if (output.text) {
      seeds.push({ ...base, type: HopEventType.Text, label: spanLabelOf(span), detail: output.text });
    }

    for (const { name, argumentsPreview } of output.toolCalls) {
      seeds.push({ ...base, type: HopEventType.ToolCall, label: name, detail: argumentsPreview });
    }

    if (!output.text && !output.toolCalls.length && !seeds.some(({ type }) => type === HopEventType.Thinking)) {
      seeds.push({ ...base, type: HopEventType.Empty, label: spanLabelOf(span) });
    }

    return seeds;
  }

  return [{ ...base, type: HopEventType.Other, label: spanLabelOf(span) }];
};

const markUnansweredCalls = (seeds: HopEventSeed[]): HopEventSeed[] => {
  const resultsByName = new Map<string, number>();
  for (const seed of seeds) {
    if (seed.type === HopEventType.ToolResult) {
      resultsByName.set(seed.label, (resultsByName.get(seed.label) ?? 0) + 1);
    }
  }

  const seenByName = new Map<string, number>();
  return seeds.map((seed) => {
    if (seed.type !== HopEventType.ToolCall) {
      return seed;
    }
    const seen = (seenByName.get(seed.label) ?? 0) + 1;
    seenByName.set(seed.label, seen);

    return { ...seed, hasNoRecordedResult: seen > (resultsByName.get(seed.label) ?? 0) };
  });
};

const seedsByHopIdOf = (seeds: HopEventSeed[]): Map<string, HopEventSeed[]> => {
  const byHopId = new Map<string, HopEventSeed[]>();
  for (const seed of seeds) {
    const existing = byHopId.get(seed.span.core_span_id);
    if (existing) {
      existing.push(seed);
    } else {
      byHopId.set(seed.span.core_span_id, [seed]);
    }
  }

  return byHopId;
};

interface HopTreeParams {
  spans: ConversationSpanRow[];
  modelOutputs: ModelCallOutput[];
}

export const buildHopTree = ({ spans, modelOutputs }: HopTreeParams): HopTreeNode[] => {
  const outputs = new Map(modelOutputs.map((output) => [output.core_span_id, output]));
  const hops = spans.filter(isConversationHop).sort(byStartTime);

  const seeds = markUnansweredCalls(hops.flatMap((span) => eventsForHop(span, outputs.get(span.core_span_id))));

  return buildSpanTree({ hops, seedsByHopId: seedsByHopIdOf(seeds) });
};
