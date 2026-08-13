import { Big } from 'big.js';

import {
  ConversationSpanNode,
  ConversationSpanRow,
  ConversationTraceTotals,
  SpanCategory,
} from '@/src/models/analytics/conversations-trace';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';
import { toBig, toNumber } from '@/src/utils/analytics/scalar';

const EVENT_KIND_CATEGORY: Record<string, SpanCategory> = {
  embedding: SpanCategory.Embedding,
  mcp: SpanCategory.Retrieval,
  route: SpanCategory.Route,
  llm_call: SpanCategory.Deployment,
};

export const spanCategoryOf = ({ success, event_kind }: ConversationSpanRow): SpanCategory => {
  if (success === false) {
    return SpanCategory.Error;
  }

  return EVENT_KIND_CATEGORY[event_kind ?? ''] ?? SpanCategory.Other;
};

export const spanLabelOf = ({ deployment, request_uri, core_span_id }: ConversationSpanRow): string =>
  deployment?.trim() || request_uri?.trim() || core_span_id;

const childrenOf = (spans: ConversationSpanRow[]): Map<string, ConversationSpanRow[]> => {
  const known = new Set(spans.map(({ core_span_id }) => core_span_id));
  const byParent = new Map<string, ConversationSpanRow[]>();

  for (const span of spans) {
    const parent = span.core_parent_span_id;
    const key = parent && known.has(parent) ? parent : '';
    byParent.set(key, [...(byParent.get(key) ?? []), span]);
  }

  return byParent;
};

export const buildSpanTree = (spans: ConversationSpanRow[]): ConversationSpanNode[] => {
  if (!spans.length) {
    return [];
  }

  const byParent = childrenOf(spans);
  const startedAt = spans
    .map(({ request_time }) => toMillis(request_time))
    .filter((value): value is number => value !== null);
  const traceStart = startedAt.length ? Math.min(...startedAt) : null;

  const walk = (parentKey: string, depth: number): ConversationSpanNode[] =>
    (byParent.get(parentKey) ?? []).flatMap((span) => {
      const startMs = toMillis(span.request_time);

      return [
        {
          span,
          depth,
          category: spanCategoryOf(span),
          offsetMs: startMs !== null && traceStart !== null ? startMs - traceStart : null,
          durationMs: toNumber(span.operation_duration_ms),
        },
        ...walk(span.core_span_id, depth + 1),
      ];
    });

  return walk('', 0);
};

export const traceTotalsOf = (spans: ConversationSpanRow[]): ConversationTraceTotals => {
  const durations = spans
    .map(({ operation_duration_ms }) => toNumber(operation_duration_ms))
    .filter((value): value is number => value !== null);

  const tokens = spans.reduce((total, { total_tokens }) => total + (toNumber(total_tokens) ?? 0), 0);
  const cost = spans.reduce(
    (total, { deployment_price }) => total.plus(toBig(deployment_price) ?? new Big(0)),
    new Big(0),
  );

  return {
    latencyMs: durations.length ? Math.max(...durations) : null,
    tokens,
    cost: cost.toString(),
    spanCount: spans.length,
    isFailed: spans.some(({ success }) => success === false),
  };
};

export const areSpansPartial = (spans: ConversationSpanRow[], total: number | null): boolean =>
  total !== null && total > spans.length;
