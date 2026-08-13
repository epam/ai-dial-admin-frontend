'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import SpanCategoryBadge from '@/src/components/Analytics/ConversationsTrace/Detail/SpanCategoryBadge';
import {
  COST_TEXT_CLASS,
  SPAN_CATEGORY_RAIL_CLASS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSpanNode } from '@/src/models/analytics/conversations-trace';
import { formatDurationMs, formatSignificantCost } from '@/src/utils/analytics/conversation-formatting';
import { spanLabelOf } from '@/src/utils/analytics/conversation-spans';

const INDENT_PER_DEPTH = 20;
const MAX_INDENT_DEPTH = 6;

interface RowProps {
  node: ConversationSpanNode;
  isSelected: boolean;
  onSelect: (coreSpanId: string) => void;
}

const SpanRow: FC<RowProps> = ({ node, isSelected, onSelect }) => {
  const { span, depth, category, durationMs } = node;

  return (
    <button
      type="button"
      aria-current={isSelected}
      onClick={() => onSelect(span.core_span_id)}
      style={{ marginLeft: Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PER_DEPTH }}
      className={classNames(
        'flex items-center gap-3 rounded border bg-layer-3 py-2 pl-0 pr-3 text-left hover:border-hover',
        isSelected ? 'border-accent-primary' : 'border-primary',
      )}
    >
      <span aria-hidden className={classNames('h-8 w-0.5 shrink-0 rounded-full', SPAN_CATEGORY_RAIL_CLASS[category])} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="min-w-0 text-primary dial-small-semi-text">
          <DialEllipsisTooltip text={spanLabelOf(span)} />
        </span>
        <span className="min-w-0 font-mono text-secondary dial-caption-text">
          <DialEllipsisTooltip text={`${span.request_method ?? ''} ${span.request_uri ?? ''}`.trim()} />
        </span>
      </span>
      <SpanCategoryBadge category={category} className="shrink-0" />
      <span className="w-14 shrink-0 text-right font-mono text-secondary dial-tiny-text">
        {formatDurationMs(durationMs) || UNAVAILABLE_VALUE}
      </span>
      <span className={classNames('w-16 shrink-0 text-right font-mono dial-tiny-text', COST_TEXT_CLASS)}>
        {formatSignificantCost(span.deployment_price) || UNAVAILABLE_VALUE}
      </span>
    </button>
  );
};

interface Props {
  nodes: ConversationSpanNode[];
  selectedSpanId: string | null;
  onSelectSpan: (coreSpanId: string) => void;
}

const ConversationSpanList: FC<Props> = ({ nodes, selectedSpanId, onSelectSpan }) => {
  const t = useI18n();

  if (!nodes.length) {
    return <p className="p-4 dial-small-text text-secondary">{t(ConversationsTraceI18nKey.TraceNoSpans)}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5 p-4">
      {nodes.map((node) => (
        <SpanRow
          key={node.span.core_span_id}
          node={node}
          isSelected={node.span.core_span_id === selectedSpanId}
          onSelect={onSelectSpan}
        />
      ))}
    </div>
  );
};

export default ConversationSpanList;
