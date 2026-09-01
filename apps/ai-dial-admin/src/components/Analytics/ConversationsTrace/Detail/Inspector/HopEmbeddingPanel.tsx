'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopEmbeddingFacts } from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber } from '@/src/utils/analytics/conversation-formatting';

const LOADER_SIZE = 18;

const dimensionsValue = (facts: HopEmbeddingFacts, t: (key: string) => string): string => {
  if (facts.isDimensionsWithheld) {
    return t(ConversationsTraceI18nKey.InspectorWithheldValue);
  }

  return facts.dimensions === null ? UNAVAILABLE_VALUE : String(facts.dimensions);
};

interface Props {
  facts: HopEmbeddingFacts | null;
  isLoading: boolean;
  tokens: number | string | null;
}

// The vector is never drawn. 96% of recorded vectors arrive base64-encoded, so any depiction means decoding
// one first — for decoration, when the question a reader opens an embedding hop with is what was embedded.
const HopEmbeddingPanel: FC<Props> = ({ facts, isLoading, tokens }) => {
  const t = useI18n();

  if (isLoading || facts === null) {
    return (
      <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
        <DialLoader size={LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
      </div>
    );
  }

  const cells = [
    { label: t(ConversationsTraceI18nKey.InspectorEmbeddingModel), value: facts.model ?? UNAVAILABLE_VALUE },
    {
      label: t(ConversationsTraceI18nKey.InspectorEmbeddingInputs),
      value: facts.inputCount === null ? UNAVAILABLE_VALUE : String(facts.inputCount),
    },
    {
      label: t(ConversationsTraceI18nKey.InspectorEmbeddingDimensions),
      // The one cell read from the response column. Withheld is not the same answer as "no vector was
      // recorded", and the placeholder cannot tell them apart.
      value: dimensionsValue(facts, t),
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
