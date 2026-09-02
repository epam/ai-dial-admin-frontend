'use client';

import { DialLoader, Tabs } from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import HopEmbeddingPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopEmbeddingPanel';
import HopMcpPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpPanel';
import HopParamsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopParamsLine';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import HopRequestPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRequestPanel';
import HopResponsePanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopResponsePanel';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import {
  useHopEmbeddingFacts,
  useHopMcpFacts,
} from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-facts';
import {
  useHopRequest,
  useHopResponse,
} from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-envelope';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationSpanRow,
  ConversationTranscriptAvailability,
  HopInspectorSide,
  HopReadState,
  HopSideSuppression,
  McpToolCallTally,
  SessionScope,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';
import { hopSideSuppressionsOf } from '@/src/utils/analytics/conversation-spans';
import { toNumber } from '@/src/utils/analytics/scalar';

const LOADER_SIZE = 18;

interface Props {
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
  kind: SpanKind;
  bodyGrants: ConversationTranscriptAvailability;
  // The turn's MCP tool calls, so the response side can say which of the tools this span asked for the turn
  // recorded no call of — and why. Carries whether the span read was complete, because that claim is only
  // sound on a complete one.
  mcpToolCalls: McpToolCallTally;
}

const HopInspector: FC<Props> = ({ scope, traceId, span, kind, bodyGrants, mcpToolCalls }) => {
  const t = useI18n();
  const [side, setSide] = useState(HopInspectorSide.Request);

  // Decided from the hop row, before any read: a protocol envelope answers both sides without a fetch, while
  // a zero-byte response settles only the side that recorded nothing.
  const suppressions = useMemo(() => hopSideSuppressionsOf(span), [span]);

  const isMcp = kind === SpanKind.Mcp;
  const isEmbedding = kind === SpanKind.Embeddings;

  const isRequestFetchable = bodyGrants.isRequestReadable && suppressions.request === null;
  const isResponseFetchable = bodyGrants.isResponseReadable && suppressions.response === null;

  const tabs = [
    ...(bodyGrants.isRequestReadable
      ? [{ id: HopInspectorSide.Request, label: t(ConversationsTraceI18nKey.InspectorRequest) }]
      : []),
    ...(bodyGrants.isResponseReadable
      ? [{ id: HopInspectorSide.Response, label: t(ConversationsTraceI18nKey.InspectorResponse) }]
      : []),
  ];

  // The side actually on screen, and the only value anything is allowed to decide from. `side` is what the
  // reader last chose; it means nothing until a tab exists for it, because a caller entitled to one side alone
  // never gets to choose. Gating the read on `side` while rendering this left the response read disabled for
  // exactly that caller — two values deciding one thing, and they drifted.
  const activeSide = tabs.some(({ id }) => id === side) ? side : ((tabs[0]?.id as HopInspectorSide) ?? side);

  const request = useHopRequest({ scope, traceId, span, isEnabled: isRequestFetchable && !isMcp && !isEmbedding });
  const response = useHopResponse({
    scope,
    traceId,
    span,
    isEnabled: isResponseFetchable && !isMcp && !isEmbedding && activeSide === HopInspectorSide.Response,
  });
  const mcp = useHopMcpFacts({ scope, traceId, span, isEnabled: isMcp && isRequestFetchable });
  const embedding = useHopEmbeddingFacts({ scope, traceId, span, isEnabled: isEmbedding && isRequestFetchable });

  // An MCP hop states a method, a tool and a toolset rather than a request and a response, so it renders as
  // one panel: tabs would split a pair that is read together.
  if (isMcp) {
    if (!isRequestFetchable) {
      return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppressions.request} />;
    }

    return <HopMcpPanel facts={mcp.facts} isLoading={mcp.isLoading} />;
  }

  // Both sides withheld: the trace view's header states why, once, so nothing is repeated here.
  if (!tabs.length) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex min-w-0 shrink-0 flex-col gap-2">
        <Tabs
          ariaLabel={t(ConversationsTraceI18nKey.InspectorTabsLabel)}
          tabs={tabs}
          activeTabId={activeSide}
          onTabChange={(id) => setSide(id as HopInspectorSide)}
        />
        {request.value && (
          <HopParamsLine
            params={request.value.params}
            // Meaningless for an embedding probe, which records no message list.
            messageCount={isEmbedding ? null : toNumber(span.number_request_messages)}
          />
        )}
      </div>
      {/* Focusable because it scrolls: a message list runs well past this height, and a scroll container
          with no tab stop puts everything below the fold out of reach for a reader with no pointer. */}
      <div tabIndex={0} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
        {activeSide === HopInspectorSide.Request && (
          <RequestSide
            isEmbedding={isEmbedding}
            isFetchable={isRequestFetchable}
            suppression={suppressions.request}
            embedding={embedding}
            request={request}
            scope={scope}
            traceId={traceId}
            span={span}
          />
        )}
        {activeSide === HopInspectorSide.Response && (
          <ResponseSide
            isFetchable={isResponseFetchable}
            suppression={suppressions.response}
            response={response}
            scope={scope}
            traceId={traceId}
            span={span}
            mcpToolCalls={mcpToolCalls}
          />
        )}
      </div>
    </div>
  );
};

type RequestState = ReturnType<typeof useHopRequest>;
type ResponseState = ReturnType<typeof useHopResponse>;
type EmbeddingState = ReturnType<typeof useHopEmbeddingFacts>;

interface SideProps {
  isFetchable: boolean;
  suppression: HopSideSuppression | null;
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
}

const Loading: FC = () => {
  const t = useI18n();

  return (
    <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
      <DialLoader size={LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
    </div>
  );
};

const RequestSide: FC<SideProps & { isEmbedding: boolean; request: RequestState; embedding: EmbeddingState }> = ({
  isEmbedding,
  isFetchable,
  suppression,
  request,
  embedding,
  scope,
  traceId,
  span,
}) => {
  if (!isFetchable) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (isEmbedding) {
    return <HopEmbeddingPanel facts={embedding.facts} isLoading={embedding.isLoading} tokens={span.total_tokens} />;
  }

  if (request.isLoading || request.value === null) {
    return <Loading />;
  }

  // A dialect no parser claims is answered with the body itself rather than with an empty panel — in an
  // observability tool a dead end is the worse failure.
  if (request.value.state === HopReadState.Unstructured) {
    return (
      <>
        <HopStateNote state={HopReadState.Unstructured} />
        <HopRawView
          scope={scope}
          traceId={traceId}
          coreSpanId={span.core_span_id}
          requestTime={span.request_time}
          side={HopInspectorSide.Request}
        />
      </>
    );
  }

  if (request.value.state !== HopReadState.Available) {
    return <HopStateNote state={request.value.state} />;
  }

  return (
    <HopRequestPanel
      envelope={request.value}
      scope={scope}
      traceId={traceId}
      coreSpanId={span.core_span_id}
      requestTime={span.request_time}
    />
  );
};

const ResponseSide: FC<SideProps & { response: ResponseState; mcpToolCalls: McpToolCallTally }> = ({
  isFetchable,
  suppression,
  response,
  scope,
  traceId,
  span,
  mcpToolCalls,
}) => {
  if (!isFetchable) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (response.isLoading || response.value === null) {
    return <Loading />;
  }

  return (
    <HopResponsePanel
      envelope={response.value}
      scope={scope}
      traceId={traceId}
      coreSpanId={span.core_span_id}
      requestTime={span.request_time}
      mcpToolCalls={mcpToolCalls}
    />
  );
};

export default HopInspector;
