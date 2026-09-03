'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopReadState, HopSideSuppression } from '@/src/models/analytics/conversations-trace';

const SUPPRESSION_KEY: Record<HopSideSuppression, string> = {
  [HopSideSuppression.NoResponse]: ConversationsTraceI18nKey.InspectorNoResponse,
  [HopSideSuppression.ProtocolNoBody]: ConversationsTraceI18nKey.InspectorProtocolNoBody,
  [HopSideSuppression.Vector]: ConversationsTraceI18nKey.InspectorVector,
};

// Withheld, empty and failed are three different facts, and a failure is not reported in the same quiet grey
// as a hop that recorded nothing — rendering them identically hides an outage behind an ordinary result.
const STATE_KEY: Partial<Record<HopReadState, string>> = {
  [HopReadState.ColumnWithheld]: ConversationsTraceI18nKey.InspectorWithheldStats,
  [HopReadState.NoBody]: ConversationsTraceI18nKey.InspectorNoBody,
  [HopReadState.Unstructured]: ConversationsTraceI18nKey.InspectorUnstructured,
};

const NOTE_CLASS = 'rounded border bg-layer-3 p-3 dial-tiny-text';

interface Props {
  state?: HopReadState;
  suppression?: HopSideSuppression | null;
  // A statement this map does not cover, rendered here so every absence reads as one thing.
  messageKey?: string;
}

const HopStateNote: FC<Props> = ({ state, suppression = null, messageKey }) => {
  const t = useI18n();

  // The same note as every other absence, marked by its border and its words rather than by a filled banner —
  // and an alert where the others are a status, being the one the reader has to act on.
  if (state === HopReadState.LoadFailed) {
    return (
      <p role="alert" className={classNames(NOTE_CLASS, 'border-error text-error')}>
        {t(ConversationsTraceI18nKey.InspectorLoadFailed)}
      </p>
    );
  }

  const mapped = suppression === null ? state && STATE_KEY[state] : SUPPRESSION_KEY[suppression];
  const key = messageKey ?? mapped;

  if (!key) {
    return null;
  }

  return (
    <p role="status" aria-live="polite" className={classNames(NOTE_CLASS, 'border-primary text-secondary')}>
      {t(key)}
    </p>
  );
};

export default HopStateNote;
