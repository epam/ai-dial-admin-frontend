'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopEmbeddingFacts } from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber } from '@/src/utils/analytics/conversation-formatting';

interface Props {
  facts: HopEmbeddingFacts | null;
  isLoading: boolean;
  tokens: number | string | null;
}

// The request half of an embedding hop: what was embedded, and the facts of the probe itself. The dimension
// count is not here — it is the one field read from the response column, and it is stated on the tab that
// reads that column.
const HopEmbeddingPanel: FC<Props> = ({ facts, isLoading, tokens }) => {
  const t = useI18n();

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  const cells = [
    { label: t(ConversationsTraceI18nKey.InspectorEmbeddingModel), value: facts.model ?? UNAVAILABLE_VALUE },
    {
      label: t(ConversationsTraceI18nKey.InspectorEmbeddingInputs),
      value: facts.inputCount === null ? UNAVAILABLE_VALUE : String(facts.inputCount),
    },
    { label: t(ConversationsTraceI18nKey.TraceTokens), value: formatCompactNumber(tokens) || UNAVAILABLE_VALUE },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        {cells.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-secondary dial-tiny-text">{label}</dt>
            <dd className="break-all text-primary dial-small-semi-text">{value}</dd>
          </div>
        ))}
      </dl>
      {facts.inputText === null ? (
        <HopStateNote state={facts.state} />
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorEmbeddingText)}</span>
          <p className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 text-primary dial-tiny-text">
            {facts.inputText}
          </p>
          <HopClampNote clamp={facts.inputClamp} />
        </div>
      )}
    </div>
  );
};

export default HopEmbeddingPanel;
