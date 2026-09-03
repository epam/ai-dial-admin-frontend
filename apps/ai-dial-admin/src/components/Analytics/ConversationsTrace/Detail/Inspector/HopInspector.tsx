'use client';

import { DialLoader, Tabs } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import HopChatPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatPanel';
import HopEmbeddingPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopEmbeddingPanel';
import HopEmbeddingResultPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopEmbeddingResultPanel';
import HopMcpArgumentsPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpArgumentsPanel';
import HopMcpFactsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpFactsLine';
import HopMcpResultPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpResultPanel';
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
import { useSpanBodyTabs } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-span-body-tabs';
import { INSPECTOR_LOADER_SIZE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationSpanRow,
  HopBodyGrants,
  HopInspectorSide,
  HopReadState,
  HopSideSuppression,
  McpToolCallTally,
  SessionScope,
  SpanBodyTab,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';
import { hopSideSuppressionsOf } from '@/src/utils/analytics/conversation-spans';
import { toNumber } from '@/src/utils/analytics/scalar';

const TAB_LABEL_KEY: Record<SpanBodyTab, string> = {
  [SpanBodyTab.Request]: ConversationsTraceI18nKey.InspectorRequest,
  [SpanBodyTab.Response]: ConversationsTraceI18nKey.InspectorResponse,
  [SpanBodyTab.Chat]: ConversationsTraceI18nKey.InspectorChat,
};

interface Props {
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
  kind: SpanKind;
  bodyGrants: HopBodyGrants;
  // The turn's MCP tool calls, so the response side can say which of the tools this span asked for the turn
  // recorded no call of — and why. Carries whether the span read was complete, because that claim is only
  // sound on a complete one.
  mcpToolCalls: McpToolCallTally;
}

const HopInspector: FC<Props> = ({ scope, traceId, span, kind, bodyGrants, mcpToolCalls }) => {
  const t = useI18n();
  const { tabs, activeTab, onSelectTab } = useSpanBodyTabs({ span, bodyGrants });

  // Decided from the hop row, before any read: a protocol envelope answers both sides without a fetch, while
  // a zero-byte response settles only the side that recorded nothing.
  const suppressions = useMemo(() => hopSideSuppressionsOf(span), [span]);

  const isMcp = kind === SpanKind.Mcp;
  const isEmbedding = kind === SpanKind.Embeddings;

  const isRequestFetchable = bodyGrants.isRequestReadable && suppressions.request === null;
  const isResponseFetchable = bodyGrants.isResponseReadable && suppressions.response === null;

  const request = useHopRequest({ scope, traceId, span, isEnabled: isRequestFetchable && !isMcp && !isEmbedding });
  const response = useHopResponse({
    scope,
    traceId,
    span,
    isEnabled:
      isResponseFetchable &&
      !isMcp &&
      !isEmbedding &&
      (activeTab === SpanBodyTab.Response || activeTab === SpanBodyTab.Chat),
  });
  // One read for both halves of an MCP hop, and it proceeds on either grant: the two sides are separate
  // columns of one row, so a caller entitled to the result and not the arguments still has something to read.
  const mcp = useHopMcpFacts({
    scope,
    traceId,
    span,
    isEnabled: isMcp && (isRequestFetchable || isResponseFetchable),
  });
  // Enabled on either grant, like the MCP read: the dimension count is a response-column field, so a caller
  // holding only that column still has a Response tab, and a read that never ran would leave it loading
  // forever.
  const embedding = useHopEmbeddingFacts({
    scope,
    traceId,
    span,
    isEnabled: isEmbedding && (bodyGrants.isRequestReadable || bodyGrants.isResponseReadable),
  });

  const tabItems = useMemo(() => tabs.map((tab) => ({ id: tab, label: t(TAB_LABEL_KEY[tab]) })), [tabs, t]);

  // The trace view does not render this section for a span with no offered tab; this is the belt to that
  // braces, and it keeps the tab strip from rendering with nothing in it.
  if (!tabs.length) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {/* Only facts read from the hop row rather than from a body live above the strip, where they are visible
          on every tab. The request's parameters are not among them: stated here they would head the Response
          tab too, describing something else. */}
      <div className="flex min-w-0 shrink-0 flex-col gap-2">
        {isMcp && <HopMcpFactsLine facts={mcp.facts} />}
        <Tabs
          ariaLabel={t(ConversationsTraceI18nKey.InspectorTabsLabel)}
          tabs={tabItems}
          activeTabId={activeTab}
          onTabChange={onSelectTab}
        />
      </div>
      {/* Focusable because it scrolls: a message list runs well past this height, and a scroll container
          with no tab stop puts everything below the fold out of reach for a reader with no pointer. */}
      <div tabIndex={0} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
        {activeTab === SpanBodyTab.Request && request.value && (
          <HopParamsLine
            params={request.value.params}
            // Meaningless for an embedding probe, which records no message list.
            messageCount={isEmbedding ? null : toNumber(span.number_request_messages)}
          />
        )}
        {activeTab === SpanBodyTab.Request && (
          <RequestSide
            isMcp={isMcp}
            isEmbedding={isEmbedding}
            isFetchable={isRequestFetchable}
            suppression={suppressions.request}
            mcp={mcp}
            embedding={embedding}
            request={request}
            scope={scope}
            traceId={traceId}
            span={span}
          />
        )}
        {activeTab === SpanBodyTab.Response && (
          <ResponseSide
            isMcp={isMcp}
            isEmbedding={isEmbedding}
            isFetchable={isResponseFetchable}
            suppression={suppressions.response}
            mcp={mcp}
            embedding={embedding}
            response={response}
            scope={scope}
            traceId={traceId}
            span={span}
            mcpToolCalls={mcpToolCalls}
          />
        )}
        {activeTab === SpanBodyTab.Chat && (
          <HopChatPanel
            scope={scope}
            traceId={traceId}
            span={span}
            request={request.value}
            isRequestLoading={request.isLoading}
            response={response.value}
            isResponseLoading={response.isLoading}
            isResponseGranted={bodyGrants.isResponseReadable}
          />
        )}
      </div>
    </div>
  );
};

type RequestState = ReturnType<typeof useHopRequest>;
type ResponseState = ReturnType<typeof useHopResponse>;
type EmbeddingState = ReturnType<typeof useHopEmbeddingFacts>;
type McpState = ReturnType<typeof useHopMcpFacts>;

interface SideProps {
  isMcp: boolean;
  isEmbedding: boolean;
  isFetchable: boolean;
  suppression: HopSideSuppression | null;
  mcp: McpState;
  embedding: EmbeddingState;
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
}

const Loading: FC = () => {
  const t = useI18n();

  return (
    <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
      <DialLoader size={INSPECTOR_LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
    </div>
  );
};

const RequestSide: FC<SideProps & { request: RequestState }> = ({
  isMcp,
  isEmbedding,
  isFetchable,
  suppression,
  mcp,
  request,
  embedding,
  scope,
  traceId,
  span,
}) => {
  // An MCP hop's arguments and an embedding probe's text are the request column read through their own kind's
  // panel, so each states its own grant rather than deferring to the generic note below.
  if (isMcp) {
    return <HopMcpArgumentsPanel facts={mcp.facts} isLoading={mcp.isLoading} suppression={suppression} />;
  }

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
  isMcp,
  isEmbedding,
  isFetchable,
  suppression,
  mcp,
  embedding,
  response,
  scope,
  traceId,
  span,
  mcpToolCalls,
}) => {
  if (isMcp) {
    return <HopMcpResultPanel facts={mcp.facts} isLoading={mcp.isLoading} suppression={suppression} />;
  }

  // The vector is never rendered, but the dimension count is the response column's own field — so this side
  // has a fact to state rather than only an explanation of what is missing.
  if (isEmbedding) {
    return (
      <HopEmbeddingResultPanel facts={embedding.facts} isLoading={embedding.isLoading} suppression={suppression} />
    );
  }

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
