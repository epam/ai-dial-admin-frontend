'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopEmbeddingFacts, HopReadState, HopSideSuppression } from '@/src/models/analytics/conversations-trace';

const dimensionsValue = (facts: HopEmbeddingFacts, t: (key: string) => string): string => {
  // Withheld is not the same answer as "no vector was recorded", and one placeholder cannot tell them apart.
  if (facts.isDimensionsWithheld) {
    return t(ConversationsTraceI18nKey.InspectorWithheldValue);
  }

  return facts.dimensions === null ? UNAVAILABLE_VALUE : String(facts.dimensions);
};

interface Props {
  facts: HopEmbeddingFacts | null;
  isLoading: boolean;
  suppression: HopSideSuppression | null;
}

/**
 * The response half of an embedding hop: the dimension count, and the statement that the vector itself is not
 * rendered.
 *
 * The count is the one field read from the response column, so this is where it belongs: beside the request's
 * own facts it would be a response fact on the request side, where a reader has no reason to look for it. The
 * vector is never drawn: 96% of recorded vectors arrive base64-encoded, so any depiction means decoding one
 * for decoration.
 */
const HopEmbeddingResultPanel: FC<Props> = ({ facts, isLoading, suppression }) => {
  const t = useI18n();

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  // Every field but the dimension count comes from the request column, so a caller denied that column has no
  // panel to state — and a dash here would read as a vector that recorded no size.
  if (facts.state === HopReadState.ColumnWithheld || facts.state === HopReadState.LoadFailed) {
    return <HopStateNote state={facts.state} />;
  }

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorEmbeddingDimensions)}</dt>
          <dd className="break-all text-primary dial-small-semi-text">{dimensionsValue(facts, t)}</dd>
        </div>
      </dl>
      {/* The suppression explains what is missing rather than replacing the tab's content: the count above is
          what this side has to say, and the note says why there is nothing more. */}
      <HopStateNote suppression={suppression} />
    </>
  );
};

export default HopEmbeddingResultPanel;
