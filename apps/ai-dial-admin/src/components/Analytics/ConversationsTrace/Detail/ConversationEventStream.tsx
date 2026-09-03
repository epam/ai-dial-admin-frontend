'use client';

import {
  DialEllipsisTooltip,
  DialGhostIconButton,
  DialNoDataContent,
  ElementSize,
  GhostButton,
} from '@epam/ai-dial-ui-kit';
import { IconCheck, IconChevronDown, IconChevronRight, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useId, useMemo, useState } from 'react';

import { useTreeExpansion } from '@/src/components/Common/TreeGrid/use-tree-expansion';
import {
  COST_TEXT_CLASS,
  EMPTY_ICON_SIZE,
  FILTER_CHIP_CLASS,
  HOP_FAILED_CHIP_CLASS,
  HOP_FAILED_RAIL_CLASS,
  NEUTRAL_CHIP_CLASS,
  SPAN_KIND_CHIP_CLASS,
  SPAN_KIND_LABEL_KEY,
  SELECTED_CHIP_CLASS,
  SPAN_KIND_RAIL_CLASS,
  TREE_GUIDE_CLASS,
  UNRECORDED_ROOT_RAIL_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  HopEmphasis,
  HopFacts,
  HopFactsShape,
  HopOutcomeFilter,
  HopTreeNode,
  HopTreeRow,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatHopDuration,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import {
  countMatchingNodes,
  countMatchableNodes,
  flattenHopTree,
  hasFailedNodes,
  kindsOf,
  markMatchingNodes,
} from '@/src/utils/analytics/conversation-span-tree';
import { formatTimeToLocalString } from '@/src/utils/formatting/date';

// The rail states the outcome where there is one and the kind of call otherwise: a failed call is what a
// reader scanning the tree needs to find first, and it keeps its kind on the badge beside it.
const railClassOf = (kind: SpanKind | null, isFailed: boolean): string => {
  if (isFailed) {
    return HOP_FAILED_RAIL_CLASS;
  }

  return kind === null ? UNRECORDED_ROOT_RAIL_CLASS : SPAN_KIND_RAIL_CLASS[kind];
};

const RAIL_COLUMN_CLASS = 'relative w-4 shrink-0 self-stretch';
const RAIL_LINE_CLASS = 'absolute left-1/2 border-l';

interface RailsProps {
  ancestorHasNextSibling: boolean[];
  depth: number;
  isLastChild: boolean;
}

const RowRails: FC<RailsProps> = ({ ancestorHasNextSibling, depth, isLastChild }) => (
  <span aria-hidden className="flex shrink-0 items-stretch">
    {ancestorHasNextSibling.map((hasNextSibling, index) => (
      <span key={index} className={RAIL_COLUMN_CLASS}>
        {hasNextSibling && <span className={classNames(RAIL_LINE_CLASS, TREE_GUIDE_CLASS, 'inset-y-0')} />}
      </span>
    ))}
    {depth > 0 && (
      <span className={RAIL_COLUMN_CLASS}>
        <span className={classNames(RAIL_LINE_CLASS, TREE_GUIDE_CLASS, isLastChild ? 'top-0 h-1/2' : 'inset-y-0')} />
        <span className={classNames('absolute left-1/2 top-1/2 w-1/2 border-t', TREE_GUIDE_CLASS)} />
      </span>
    )}
  </span>
);

interface FactsProps {
  facts: HopFacts;
}

// Which figures a row states is decided by what its hop recorded, never by what kind of call it was. A hop
// that metered nothing of its own would otherwise lead with `0 tok` and a dash where the reader expects its
// most important figure — see `hopFactsOf`.
const RowFacts: FC<FactsProps> = ({ facts }) => {
  const t = useI18n();

  if (facts.shape === HopFactsShape.Metered) {
    const cost = formatSignificantCost(facts.cost);

    return (
      <>
        {facts.tokens !== null && (
          <span>{t(ConversationsTraceI18nKey.SpanTokens, { count: formatCompactNumber(facts.tokens) })}</span>
        )}
        {facts.requestMessages !== null && (
          <span>{t(ConversationsTraceI18nKey.SpanRequestMessages, { count: facts.requestMessages })}</span>
        )}
        {cost && <span className={COST_TEXT_CLASS}>{cost}</span>}
      </>
    );
  }

  const chainCost = formatSignificantCost(facts.chainCost);

  return <span className={COST_TEXT_CLASS}>{t(ConversationsTraceI18nKey.SpanChainCost, { cost: chainCost })}</span>;
};

interface RowProps {
  row: HopTreeRow;
  rowElementId: (nodeId: string) => string;
  isSelected: boolean;
  isEmphasisActive: boolean;
  onSelect: (coreSpanId: string) => void;
  onToggleExpand: (node: HopTreeNode) => void;
}

const HopTreeRowView: FC<RowProps> = ({
  row,
  rowElementId,
  isSelected,
  isEmphasisActive,
  onSelect,
  onToggleExpand,
}) => {
  const t = useI18n();
  const { node, ancestorHasNextSibling, isLastChild } = row;
  const { type, span, label, detail, facts, depth, expanded, children } = node;
  const isOpenable = span !== null;
  const isDimmed = isEmphasisActive && !node.isMatch;

  const duration = formatHopDuration(node.durationMs);

  const cardClassName = classNames(
    'flex min-w-0 flex-1 items-center gap-2 rounded border bg-layer-3',
    (isOpenable || children.length > 0) && 'hover:border-hover focus-within:border-hover',
    isSelected ? 'border-accent-primary' : 'border-primary',
    node.isFailed && 'border-error',
    isDimmed && 'opacity-50',
  );

  const rowClassName = 'flex min-w-0 flex-1 items-center gap-3 py-1.5 pr-3 text-left';

  const content = (
    <>
      <span className="w-10 shrink-0 text-right font-mono text-secondary dial-caption-text">{node.position}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isOpenable ? (
          <span className="truncate text-primary dial-small-semi-text">{label}</span>
        ) : (
          <span className="min-w-0 text-primary dial-small-semi-text">
            <DialEllipsisTooltip text={label} />
          </span>
        )}
        {/* What the hop did and what it recorded, on one line beneath who did it. An MCP row states its
            server above and its method here, so two protocol messages of different servers in the same
            second are told apart. Rendered only where there is something to say: a hop that recorded no
            phase and no figures is a one-line row, not a row with a blank line under it. */}
        {(detail !== null || facts !== null) && (
          <span className="flex min-w-0 items-center gap-2 truncate font-mono text-secondary dial-caption-text">
            {detail !== null && <span className="truncate">{detail}</span>}
            {facts !== null && <RowFacts facts={facts} />}
          </span>
        )}
      </span>
      {/* Persistent, and independent of the current emphasis: a failure must not be reachable only by having
          filtered for one. It sits beside the node's kind rather than replacing it. */}
      {node.isFailed && (
        <span className={classNames('shrink-0 rounded border px-1.5 py-0.5 dial-caption-text', HOP_FAILED_CHIP_CLASS)}>
          {t(ConversationsTraceI18nKey.SpanFailedMarker)}
        </span>
      )}
      {node.isMatch && (
        <span className="shrink-0 rounded border border-accent-primary px-1.5 py-0.5 text-accent-primary dial-caption-text">
          {t(ConversationsTraceI18nKey.StreamMatch)}
        </span>
      )}
      <span
        className={classNames(
          'w-24 shrink-0 truncate rounded px-2 py-0.5 text-center dial-tiny-semi-text',
          type === null ? NEUTRAL_CHIP_CLASS : SPAN_KIND_CHIP_CLASS[type],
        )}
      >
        {type === null ? t(ConversationsTraceI18nKey.TraceRootNotRecorded) : t(SPAN_KIND_LABEL_KEY[type])}
      </span>
      {/* Empty for a duration the producer reported as zero: a core predating the field stores zero for "not
          reported", so zero is not a zero-millisecond call and the formatter answers empty for both. */}
      <span className="w-16 shrink-0 text-right font-mono text-secondary dial-tiny-text">{duration}</span>
      <span className="w-20 shrink-0 text-right font-mono text-secondary dial-tiny-text">
        {node.startedAtMs === null ? '' : formatTimeToLocalString(node.startedAtMs)}
      </span>
    </>
  );

  return (
    <div className="flex items-stretch gap-1">
      <RowRails ancestorHasNextSibling={ancestorHasNextSibling} depth={depth} isLastChild={isLastChild} />
      <div className={cardClassName}>
        <span aria-hidden className={classNames('ml-1 h-7 shrink-0 border-l-2', railClassOf(type, node.isFailed))} />
        {children.length > 0 ? (
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={
              expanded ? (
                <IconChevronDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              ) : (
                <IconChevronRight {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              )
            }
            aria-label={t(expanded ? ConversationsTraceI18nKey.TreeCollapse : ConversationsTraceI18nKey.TreeExpand)}
            aria-expanded={expanded}
            aria-controls={expanded ? children.map(({ id }) => rowElementId(id)).join(' ') : undefined}
            onClick={() => onToggleExpand(node)}
            className="shrink-0"
          />
        ) : (
          <span aria-hidden className="w-6 shrink-0" />
        )}
        {isOpenable ? (
          <button
            type="button"
            id={rowElementId(node.id)}
            aria-current={isSelected}
            onClick={() => onSelect(span.core_span_id)}
            className={rowClassName}
          >
            {content}
          </button>
        ) : (
          <div id={rowElementId(node.id)} className={rowClassName}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  tree: HopTreeNode[];
  selectedSpanId: string | null;
  onSelectSpan: (coreSpanId: string) => void;
}

const ConversationEventStream: FC<Props> = ({ tree, selectedSpanId, onSelectSpan }) => {
  const t = useI18n();
  const treeId = useId();
  const [emphasis, setEmphasis] = useState<HopEmphasis | null>(null);

  const markedTree = useMemo(() => markMatchingNodes(tree, emphasis), [tree, emphasis]);
  const { currentTree, onToggleExpand } = useTreeExpansion(markedTree, { isDefaultExpanded: true });
  const rows = useMemo(() => flattenHopTree(currentTree), [currentTree]);

  const kinds = useMemo(() => kindsOf(tree), [tree]);
  // The outcome axis gets a control only when the turn recorded a failure — a control for something the turn
  // has none of would dim every node and mark none.
  const hasFailures = useMemo(() => hasFailedNodes(tree), [tree]);
  const totalCount = useMemo(() => countMatchableNodes(tree), [tree]);
  const matchCount = useMemo(() => countMatchingNodes(markedTree), [markedTree]);

  const rowElementId = useCallback((nodeId: string) => `${treeId}-${nodeId.replace(/\s+/g, '_')}`, [treeId]);

  const onEmphasise = useCallback(
    (next: HopEmphasis) => setEmphasis((current) => (current === next ? null : next)),
    [],
  );

  if (!tree.length) {
    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={<IconSubtask size={EMPTY_ICON_SIZE} aria-hidden />}
          title={t(ConversationsTraceI18nKey.TraceNoSpans)}
          containerClassName="max-w-[520px] self-center p-6"
          titleClassName="dial-tiny-semi-text"
          descriptionClassName="dial-small-text"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        role="group"
        aria-label={t(ConversationsTraceI18nKey.StreamFilterLabel)}
        className="flex shrink-0 flex-wrap items-center gap-1 border-b border-primary px-4 py-2"
      >
        <GhostButton
          size={ElementSize.Small}
          aria-pressed={emphasis === null}
          label={t(ConversationsTraceI18nKey.StreamTabAll)}
          iconBefore={emphasis === null ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
          onClick={() => setEmphasis(null)}
          className={classNames(FILTER_CHIP_CLASS, emphasis === null ? SELECTED_CHIP_CLASS : NEUTRAL_CHIP_CLASS)}
          textClassName="dial-tiny-text"
        />
        <span aria-hidden className="mx-1 h-4 shrink-0 border-l border-primary" />
        {kinds.map((kind) => (
          <GhostButton
            key={kind}
            size={ElementSize.Small}
            aria-pressed={emphasis === kind}
            label={t(SPAN_KIND_LABEL_KEY[kind])}
            iconBefore={emphasis === kind ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
            onClick={() => onEmphasise(kind)}
            className={classNames(
              FILTER_CHIP_CLASS,
              emphasis === kind ? SELECTED_CHIP_CLASS : SPAN_KIND_CHIP_CLASS[kind],
            )}
            textClassName="dial-tiny-text"
          />
        ))}
        {hasFailures && (
          <GhostButton
            size={ElementSize.Small}
            aria-pressed={emphasis === HopOutcomeFilter.Failed}
            label={t(ConversationsTraceI18nKey.EventFailed)}
            iconBefore={
              emphasis === HopOutcomeFilter.Failed ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined
            }
            onClick={() => onEmphasise(HopOutcomeFilter.Failed)}
            className={classNames(
              FILTER_CHIP_CLASS,
              emphasis === HopOutcomeFilter.Failed ? SELECTED_CHIP_CLASS : HOP_FAILED_CHIP_CLASS,
            )}
            textClassName="dial-tiny-text"
          />
        )}
        <span role="status" aria-live="polite" className="ml-auto font-mono text-secondary dial-caption-text">
          {emphasis === null
            ? ''
            : t(ConversationsTraceI18nKey.StreamMatchCount, { count: matchCount, total: totalCount })}
        </span>
      </div>
      <div
        role="group"
        aria-label={t(ConversationsTraceI18nKey.StreamLabel)}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4"
      >
        {rows.map((row) => (
          <HopTreeRowView
            key={row.node.id}
            row={row}
            rowElementId={rowElementId}
            isSelected={row.node.span !== null && row.node.span.core_span_id === selectedSpanId}
            isEmphasisActive={emphasis !== null}
            onSelect={onSelectSpan}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationEventStream;
