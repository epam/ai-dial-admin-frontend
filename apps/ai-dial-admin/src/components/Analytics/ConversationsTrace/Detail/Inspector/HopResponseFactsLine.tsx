'use client';

import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopResponseFacts } from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber } from '@/src/utils/analytics/conversation-formatting';

interface Props {
  facts: HopResponseFacts;
  finishReason: string | null;
}

/**
 * What answered, and at what cost — the facts a response states about itself.
 *
 * None of them is on the hop row. The row carries the *deployment* name, which is not the string the upstream
 * reports as its model: a deployment can route to a model whose own id and version the row never records, and
 * "which model actually answered this" is a question the deployment name cannot settle. The row carries the
 * token total but not its split, and nothing anywhere carries the cached count — the one figure that
 * explains a bill the total does not.
 *
 * A value the provider did not report is omitted rather than dashed: unlike a request parameter, whose
 * absence means the call ran on a default, an unreported token count says nothing about the call. A reported
 * zero is kept, because "no cache hit" is an answer.
 */
const HopResponseFactsLine: FC<Props> = ({ facts, finishReason }) => {
  const t = useI18n();

  // A response with nothing to state resolves to nothing here rather than at the call site. This line renders
  // above the response panel's own state check — by design, so that what answered heads the reply — which
  // means it is handed the envelope of a failed or empty read too. Reading a field off such an envelope's
  // facts crashes the whole tab instead of letting the placeholder underneath it render.
  if (facts == null) {
    return null;
  }

  const stated: { label: string; value: string }[] = [
    ...(facts.model === null
      ? []
      : [{ label: t(ConversationsTraceI18nKey.InspectorUpstreamModel), value: facts.model }]),
    ...(finishReason === null
      ? []
      : [{ label: t(ConversationsTraceI18nKey.InspectorFinishReason), value: finishReason }]),
    ...(facts.promptTokens === null
      ? []
      : [
          {
            label: t(ConversationsTraceI18nKey.InspectorPromptTokens),
            value: formatCompactNumber(facts.promptTokens),
          },
        ]),
    ...(facts.completionTokens === null
      ? []
      : [
          {
            label: t(ConversationsTraceI18nKey.InspectorCompletionTokens),
            value: formatCompactNumber(facts.completionTokens),
          },
        ]),
    ...(facts.cachedTokens === null
      ? []
      : [
          {
            label: t(ConversationsTraceI18nKey.InspectorCachedTokens),
            value: formatCompactNumber(facts.cachedTokens),
          },
        ]),
    ...(facts.completionId === null
      ? []
      : [{ label: t(ConversationsTraceI18nKey.InspectorCompletionId), value: facts.completionId }]),
  ];

  if (!stated.length) {
    return null;
  }

  return (
    <dl
      role="group"
      aria-label={t(ConversationsTraceI18nKey.InspectorResponseFactsLabel)}
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 font-mono text-secondary dial-caption-text"
    >
      {stated.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 items-center gap-1">
          <dt>{label}</dt>
          <dd className="truncate text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default HopResponseFactsLine;
