'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopReadState, HopSideSuppression } from '@/src/models/analytics/sessions-trace';

const SUPPRESSION_KEY: Record<HopSideSuppression, string> = {
  [HopSideSuppression.NoResponse]: SessionsTraceI18nKey.InspectorNoResponse,
  [HopSideSuppression.ProtocolNoBody]: SessionsTraceI18nKey.InspectorProtocolNoBody,
  [HopSideSuppression.Vector]: SessionsTraceI18nKey.InspectorVector,
};

// Withheld, empty and failed are three different facts, and a failure is not reported in the same quiet grey
// as a hop that recorded nothing — rendering them identically hides an outage behind an ordinary result.
const STATE_KEY: Partial<Record<HopReadState, string>> = {
  [HopReadState.ColumnWithheld]: SessionsTraceI18nKey.InspectorWithheldStats,
  [HopReadState.NoBody]: SessionsTraceI18nKey.InspectorNoBody,
  [HopReadState.Unstructured]: SessionsTraceI18nKey.InspectorUnstructured,
  [HopReadState.LoadFailed]: SessionsTraceI18nKey.InspectorLoadFailed,
};

const NOTE_CLASS = 'rounded border bg-layer-3 p-3 dial-tiny-text';

interface Props {
  state?: HopReadState;
  suppression?: HopSideSuppression | null;
  // A statement this map does not cover, rendered here so every absence reads as one thing.
  messageKey?: string;
  // Words the log recorded rather than words this app wrote — a failed hop's own error message. Stated
  // through this note for the same reason every other absence is: one treatment, so a reader tells them
  // apart by what they say rather than by what kind of box they arrived in.
  message?: string;
  isFailure?: boolean;
}

const HopStateNote: FC<Props> = ({ state, suppression = null, messageKey, message, isFailure = false }) => {
  const t = useI18n();

  const mapped = suppression === null ? state && STATE_KEY[state] : SUPPRESSION_KEY[suppression];
  const key = messageKey ?? mapped;
  const text = message ?? (key ? t(key) : null);

  if (!text) {
    return null;
  }

  // The same note as every other absence, marked by its border and its words rather than by a filled banner —
  // and an alert where the others are a status, being the one the reader has to act on.
  if (isFailure || state === HopReadState.LoadFailed) {
    return (
      <p role="alert" className={classNames(NOTE_CLASS, 'whitespace-pre-wrap break-words border-error text-error')}>
        {text}
      </p>
    );
  }

  return (
    <p role="status" aria-live="polite" className={classNames(NOTE_CLASS, 'border-primary text-secondary')}>
      {text}
    </p>
  );
};

export default HopStateNote;
