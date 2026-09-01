'use client';

import { Notification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopReadState, HopSideSuppression } from '@/src/models/analytics/conversations-trace';

const SUPPRESSION_KEY: Record<HopSideSuppression, string> = {
  [HopSideSuppression.NoResponse]: ConversationsTraceI18nKey.InspectorNoResponse,
  [HopSideSuppression.SessionSetup]: ConversationsTraceI18nKey.InspectorSessionSetup,
  [HopSideSuppression.Vector]: ConversationsTraceI18nKey.InspectorVector,
};

// Withheld, empty and failed are three different facts, and a failure is not reported in the same quiet grey
// as a hop that recorded nothing — rendering them identically hides an outage behind an ordinary result.
const STATE_KEY: Partial<Record<HopReadState, string>> = {
  [HopReadState.ColumnWithheld]: ConversationsTraceI18nKey.InspectorWithheldStats,
  [HopReadState.NoBody]: ConversationsTraceI18nKey.InspectorNoBody,
  [HopReadState.Unstructured]: ConversationsTraceI18nKey.InspectorUnstructured,
};

interface Props {
  state?: HopReadState;
  suppression?: HopSideSuppression | null;
}

const HopStateNote: FC<Props> = ({ state, suppression = null }) => {
  const t = useI18n();

  if (state === HopReadState.LoadFailed) {
    return (
      <Notification
        variant={NotificationVariant.Error}
        message={t(ConversationsTraceI18nKey.InspectorLoadFailed)}
        textClassName="dial-tiny-text"
      />
    );
  }

  const key = suppression === null ? state && STATE_KEY[state] : SUPPRESSION_KEY[suppression];

  if (!key) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded border border-primary bg-layer-3 p-3 dial-tiny-text text-secondary"
    >
      {t(key)}
    </p>
  );
};

export default HopStateNote;
