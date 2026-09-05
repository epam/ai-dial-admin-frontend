'use client';

import { Tabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useMemo, useState } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopChatPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatPanel';
import HopEmbeddingPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopEmbeddingPanel';
import HopEmbeddingResultPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopEmbeddingResultPanel';
import HopMcpArgumentsPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpArgumentsPanel';
import HopMcpFactsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpFactsLine';
import HopMcpResultPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMcpResultPanel';
import HopParamsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopParamsLine';
import HopProtocolRequestPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopProtocolRequestPanel';
import HopProtocolResultPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopProtocolResultPanel';
import HopRawSwitch from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawSwitch';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import HopRequestPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRequestPanel';
import HopTransportLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopTransportLine';
import HopResponseFactsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopResponseFactsLine';
import HopResponsePanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopResponsePanel';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import {
  useHopEmbeddingFacts,
  useHopMcpFacts,
  useHopProtocolFacts,
} from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-facts';
import {
  useHopRequest,
  useHopResponse,
} from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-envelope';
import { useSpanBodyTabs } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-span-body-tabs';
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
import { hopSideSuppressionsOf, hopTransportOf, isProtocolEnvelope } from '@/src/utils/analytics/conversation-spans';
import { toNumber } from '@/src/utils/analytics/scalar';

const MODEL_PARAM = 'model';

// No border colour here: Tailwind settles two colour utilities by stylesheet order, not by class-attribute
// order, so appending one to another painted the wrong border. Each call site chooses.
const FACTS_BAR_CLASS = 'flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 rounded border bg-layer-3 px-3 py-1.5';

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
  const [isRawRequest, setIsRawRequest] = useState(false);
  const [isRawResponse, setIsRawResponse] = useState(false);

  // Decided from the hop row, before any read: a protocol envelope answers both sides without a fetch, while
  // a zero-byte response settles only the side that recorded nothing.
  const suppressions = useMemo(() => hopSideSuppressionsOf(span), [span]);
  const transport = useMemo(() => hopTransportOf(span), [span]);

  const isMcp = kind === SpanKind.Mcp;
  const isEmbedding = kind === SpanKind.Embeddings;
  const isProtocol = isMcp && isProtocolEnvelope(span);

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
    isEnabled: isMcp && !isProtocol && (isRequestFetchable || isResponseFetchable),
  });
  const protocol = useHopProtocolFacts({
    scope,
    traceId,
    span,
    isEnabled: isProtocol && (isRequestFetchable || isResponseFetchable),
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

  const requestedModel = request.value?.params.stated.find(({ name }) => name === MODEL_PARAM)?.value ?? null;

  const tabItems = useMemo(() => tabs.map((tab) => ({ id: tab, label: t(TAB_LABEL_KEY[tab]) })), [tabs, t]);

  // Rendering nothing for a caller entitled to neither column reports an entitlement as an absence of events.
  if (!tabs.length) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 bg-layer-1">
        <HopTransportLine transport={transport} side={null} />
        <HopStateNote state={HopReadState.ColumnWithheld} />
      </div>
    );
  }

  return (
    // One ground from strip to body: a transparent band at a pinned element's seam is where a stale repaint
    // survives.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-layer-1">
      {/* Below the strip — and still outside the scroll container, so the longest result cannot carry them off
          the screen — sit only facts read from the hop row rather than from a body. The request's parameters
          are not among them: stated here they would head the Response tab too, describing something else. */}
      <div className="flex min-w-0 shrink-0 flex-col gap-2 bg-layer-1 pb-3">
        <Tabs
          ariaLabel={t(ConversationsTraceI18nKey.InspectorTabsLabel)}
          tabs={tabItems}
          activeTabId={activeTab}
          onTabChange={onSelectTab}
        />
        {isMcp && <HopMcpFactsLine facts={mcp.facts} />}
      </div>
      {/* Focusable because it scrolls: a message list runs well past this height, and a scroll container
          with no tab stop puts everything below the fold out of reach for a reader with no pointer. */}
      <div tabIndex={0} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto bg-layer-1">
        {activeTab === SpanBodyTab.Request && (
          <div className={classNames(FACTS_BAR_CLASS, 'border-primary')}>
            <HopTransportLine transport={transport} side={HopInspectorSide.Request} />
            {request.value && (
              <HopParamsLine
                params={request.value.params}
                messageCount={request.value.messages.length ? null : toNumber(span.number_request_messages)}
              />
            )}
            {/* Offered only where there is a body to swap in: an MCP or embedding hop states facts rather than
                an envelope, and a hop that recorded no message list has nothing the bytes would replace. */}
            {(request.value?.messages.length ?? 0) > 0 && (
              <HopRawSwitch isRaw={isRawRequest} onChange={setIsRawRequest} />
            )}
          </div>
        )}
        {activeTab === SpanBodyTab.Request && (
          <RequestSide
            isMcp={isMcp}
            isProtocol={isProtocol}
            protocol={protocol}
            isEmbedding={isEmbedding}
            isFetchable={isRequestFetchable}
            suppression={suppressions.request}
            mcp={mcp}
            embedding={embedding}
            request={request}
            isRaw={isRawRequest}
            scope={scope}
            traceId={traceId}
            span={span}
          />
        )}
        {activeTab === SpanBodyTab.Response && (
          <div className={classNames(FACTS_BAR_CLASS, transport.hasFailed ? 'border-error' : 'border-primary')}>
            <HopTransportLine transport={transport} side={HopInspectorSide.Response} />
            {/* What answered, stated here rather than inside the panel: it describes the response whichever
                form of it the panel is showing, so it survives the raw switch without the panel deciding. */}
            {response.value && (
              <>
                <HopResponseFactsLine
                  facts={response.value.facts}
                  finishReason={response.value.finishReason}
                  requestedModel={requestedModel}
                />
                {/* Not offered where the panel is already showing the recorded bytes: a body no parser claims
                    has no assembled form to switch back to. */}
                {response.value.state !== HopReadState.Unstructured && (
                  <HopRawSwitch isRaw={isRawResponse} onChange={setIsRawResponse} />
                )}
              </>
            )}
          </div>
        )}
        {activeTab === SpanBodyTab.Response && (
          <ResponseSide
            isMcp={isMcp}
            isProtocol={isProtocol}
            protocol={protocol}
            isEmbedding={isEmbedding}
            isFetchable={isResponseFetchable}
            suppression={suppressions.response}
            mcp={mcp}
            embedding={embedding}
            response={response}
            isRaw={isRawResponse}
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
type ProtocolState = ReturnType<typeof useHopProtocolFacts>;

interface SideProps {
  isMcp: boolean;
  isProtocol: boolean;
  isEmbedding: boolean;
  isFetchable: boolean;
  suppression: HopSideSuppression | null;
  mcp: McpState;
  protocol: ProtocolState;
  embedding: EmbeddingState;
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
}

const RequestSide: FC<SideProps & { request: RequestState; isRaw: boolean }> = ({
  isMcp,
  isProtocol,
  isEmbedding,
  isFetchable,
  suppression,
  mcp,
  protocol,
  request,
  isRaw,
  embedding,
  scope,
  traceId,
  span,
}) => {
  // An MCP hop's arguments, a protocol message's parameters and an embedding probe's text are the request
  // column read through their own kind's panel, so each states its own grant rather than deferring to the
  // generic note below.
  if (isProtocol) {
    return <HopProtocolRequestPanel facts={protocol.facts} isLoading={protocol.isLoading} suppression={suppression} />;
  }

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
    return <HopPanelLoader />;
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
      isRaw={isRaw}
      scope={scope}
      traceId={traceId}
      coreSpanId={span.core_span_id}
      requestTime={span.request_time}
    />
  );
};

const ResponseSide: FC<SideProps & { response: ResponseState; mcpToolCalls: McpToolCallTally; isRaw: boolean }> = ({
  isMcp,
  isProtocol,
  isEmbedding,
  isFetchable,
  suppression,
  mcp,
  protocol,
  embedding,
  response,
  isRaw,
  scope,
  traceId,
  span,
  mcpToolCalls,
}) => {
  if (isProtocol) {
    return <HopProtocolResultPanel facts={protocol.facts} isLoading={protocol.isLoading} suppression={suppression} />;
  }

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
    return <HopPanelLoader />;
  }

  if (response.value.state === HopReadState.Unstructured) {
    return (
      <>
        <HopStateNote state={HopReadState.Unstructured} />
        <HopRawView
          scope={scope}
          traceId={traceId}
          coreSpanId={span.core_span_id}
          requestTime={span.request_time}
          side={HopInspectorSide.Response}
        />
      </>
    );
  }

  return (
    <HopResponsePanel
      envelope={response.value}
      isRaw={isRaw}
      scope={scope}
      traceId={traceId}
      coreSpanId={span.core_span_id}
      requestTime={span.request_time}
      mcpToolCalls={mcpToolCalls}
    />
  );
};

export default HopInspector;
