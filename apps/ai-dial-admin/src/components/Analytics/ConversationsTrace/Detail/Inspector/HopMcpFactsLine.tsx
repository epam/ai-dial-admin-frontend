'use client';

import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopMcpFacts } from '@/src/models/analytics/conversations-trace';

interface Props {
  facts: HopMcpFacts | null;
}

/**
 * An MCP hop's method, tool and toolset — plain hop-row columns belonging to neither body side.
 *
 * They render above the tab strip, in the slot the request's parameters occupy, so they stay visible whichever
 * half of the hop the reader is on. Duplicating them onto both tabs would state the same thing twice and leave
 * a reader wondering whether the two copies could differ.
 *
 * The toolset is the hop's deployment: one measured conversation recorded all of its MCP hops under a single
 * parent span, distinguishable only by it. No session field is stated — the hop log has no session column for
 * MCP, and a field with no source gets filled with the wrong thing.
 */
const HopMcpFactsLine: FC<Props> = ({ facts }) => {
  const t = useI18n();

  const rows = [
    { label: t(ConversationsTraceI18nKey.InspectorMcpMethod), value: facts?.method ?? null },
    { label: t(ConversationsTraceI18nKey.InspectorMcpTool), value: facts?.toolName ?? null },
    { label: t(ConversationsTraceI18nKey.InspectorMcpToolset), value: facts?.toolset ?? null },
  ].filter(({ value }) => value !== null);

  if (!rows.length) {
    return null;
  }

  return (
    <dl
      role="group"
      aria-label={t(ConversationsTraceI18nKey.InspectorMcpFactsLabel)}
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-secondary dial-caption-text"
    >
      {rows.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 items-center gap-1">
          <dt>{label}</dt>
          <dd className="truncate text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default HopMcpFactsLine;
