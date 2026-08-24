import { ROUTE_EVENT_KIND, UTILITY_URI_MARKERS } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  ConversationTurnRow,
  HopEvent,
  HopEventType,
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
import { toNumber } from '@/src/utils/analytics/scalar';

const HTTP_ERROR_STATUS = 400;

export const isConversationHop = (span: ConversationSpanRow): boolean => span.event_kind?.trim() !== ROUTE_EVENT_KIND;

const isUtility = ({ request_uri }: ConversationSpanRow): boolean => {
  const uri = request_uri?.trim() ?? '';
  return UTILITY_URI_MARKERS.some((marker) => uri.includes(marker));
};

export const isFailedHop = ({ success, response_status }: ConversationSpanRow): boolean =>
  success === false || (toNumber(response_status) ?? 0) >= HTTP_ERROR_STATUS;

interface EventSeed {
  type: HopEventType;
  label: string;
  detail?: string | null;
  span: ConversationSpanRow | null;
  tokens?: number | null;
  reasoningTokens?: number | null;
  cost?: number | string | null;
  hops?: number | null;
  durationMs?: number | null;
  hasNoRecordedResult?: boolean;
}

const byStartTime = (left: ConversationSpanRow, right: ConversationSpanRow): number =>
  (toMillis(left.request_time) ?? 0) - (toMillis(right.request_time) ?? 0);

const eventsForHop = (span: ConversationSpanRow, output: ModelCallOutput | undefined): EventSeed[] => {
  const tokens = toNumber(span.total_tokens);
  const reasoningTokens = toNumber(span.reasoning_tokens);
  const base = { span, tokens, cost: span.deployment_price };

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
    const seeds: EventSeed[] = [];

    if (reasoningTokens !== null && reasoningTokens > 0) {
      seeds.push({ ...base, type: HopEventType.Thinking, label: spanLabelOf(span), reasoningTokens, tokens: null });
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
      seeds.push({ ...base, type: HopEventType.ToolCall, label: name, detail: argumentsPreview, tokens: null });
    }

    if (!output.text && !output.toolCalls.length && !seeds.some(({ type }) => type === HopEventType.Thinking)) {
      seeds.push({ ...base, type: HopEventType.Empty, label: spanLabelOf(span) });
    }

    return seeds;
  }

  return [{ ...base, type: HopEventType.Other, label: spanLabelOf(span) }];
};

const markUnansweredCalls = (seeds: EventSeed[]): EventSeed[] => {
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

interface StreamParams {
  spans: ConversationSpanRow[];
  modelOutputs: ModelCallOutput[];
  turn: ConversationTurnRow;
  question?: string;
}

export const buildHopEventStream = ({ spans, modelOutputs, turn, question }: StreamParams): HopEvent[] => {
  const outputs = new Map(modelOutputs.map((output) => [output.core_span_id, output]));
  const hops = spans.filter(isConversationHop).sort(byStartTime);

  const seeds: EventSeed[] = [
    { type: HopEventType.TurnStart, label: question ?? '', span: null },
    ...hops.flatMap((span) => eventsForHop(span, outputs.get(span.core_span_id))),
    {
      type: HopEventType.TurnComplete,
      label: '',
      span: null,
      tokens: toNumber(turn.tokens),
      cost: turn.cost,
      hops: toNumber(turn.hops),
      durationMs: toNumber(turn.duration_ms),
    },
  ];

  return markUnansweredCalls(seeds).map((seed, index) => ({
    key: `${seed.span?.core_span_id ?? seed.type}-${index}`,
    line: index + 1,
    type: seed.type,
    label: seed.label,
    detail: seed.detail ?? null,
    span: seed.span,
    startedAtMs: seed.span ? toMillis(seed.span.request_time) : null,
    tokens: seed.tokens ?? null,
    reasoningTokens: seed.reasoningTokens ?? null,
    cost: seed.cost ?? null,
    hops: seed.hops ?? null,
    durationMs: seed.durationMs ?? null,
    hasNoRecordedResult: seed.hasNoRecordedResult ?? false,
  }));
};

export const FILTERABLE_EVENT_TYPES: HopEventType[] = [
  HopEventType.Text,
  HopEventType.ToolCall,
  HopEventType.ToolResult,
  HopEventType.Thinking,
  HopEventType.Error,
  HopEventType.Empty,
  HopEventType.Session,
  HopEventType.Embedding,
  HopEventType.Other,
];

const FRAME_TYPES: HopEventType[] = [HopEventType.TurnStart, HopEventType.TurnComplete];

export const filterEvents = (events: HopEvent[], types: HopEventType[]): HopEvent[] =>
  events.filter(({ type }) => types.includes(type));

export const hasFilteredRows = (events: HopEvent[]): boolean => events.some(({ type }) => !FRAME_TYPES.includes(type));

// The frame is not one of the turn's rows, so it belongs to neither side of a "showing n of m" count.
export const rowCountOf = (events: HopEvent[]): number =>
  events.filter(({ type }) => !FRAME_TYPES.includes(type)).length;
