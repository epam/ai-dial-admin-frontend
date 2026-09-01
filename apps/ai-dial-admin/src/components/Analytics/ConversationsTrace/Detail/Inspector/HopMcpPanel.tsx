'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopMcpFacts, HopReadState } from '@/src/models/analytics/conversations-trace';

const LOADER_SIZE = 18;

interface BlockProps {
  label: string;
  text: string;
}

const McpBlock: FC<BlockProps> = ({ label, text }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <pre className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 font-mono text-primary dial-caption-text">
      {text}
    </pre>
  </div>
);

interface Props {
  facts: HopMcpFacts | null;
  isLoading: boolean;
}

const HopMcpPanel: FC<Props> = ({ facts, isLoading }) => {
  const t = useI18n();

  if (isLoading || facts === null) {
    return (
      <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
        <DialLoader size={LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
      </div>
    );
  }

  const rows = [
    { label: t(ConversationsTraceI18nKey.InspectorMcpMethod), value: facts.method },
    { label: t(ConversationsTraceI18nKey.InspectorMcpTool), value: facts.toolName },
    // The toolset is the hop's deployment. No session field is stated: the hop log records no session column
    // for MCP, and one measured conversation's 277 MCP hops shared a single parent span, distinguishable only
    // by the deployment.
    { label: t(ConversationsTraceI18nKey.InspectorMcpToolset), value: facts.toolset },
  ].filter(({ value }) => value !== null);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-secondary dial-tiny-text">{label}</dt>
            <dd className="break-all font-mono text-primary dial-tiny-text">{value}</dd>
          </div>
        ))}
      </dl>
      {facts.state === HopReadState.Available ? (
        <>
          {facts.argumentsText && (
            <McpBlock label={t(ConversationsTraceI18nKey.InspectorMcpArguments)} text={facts.argumentsText} />
          )}
          {/* The result is the response column and the arguments are the request one, so a caller granted only
              one side sees the other stated as withheld rather than as a hop that recorded nothing. */}
          {facts.resultText ? (
            <McpBlock label={t(ConversationsTraceI18nKey.InspectorMcpResult)} text={facts.resultText} />
          ) : (
            <HopStateNote state={facts.resultState} />
          )}
          {/* A `tools/call` result averages 123 KB, so this clamp fires in practice rather than in theory. */}
          <HopClampNote clamp={facts.resultClamp} />
        </>
      ) : (
        <HopStateNote state={facts.state} />
      )}
    </div>
  );
};

export default HopMcpPanel;
