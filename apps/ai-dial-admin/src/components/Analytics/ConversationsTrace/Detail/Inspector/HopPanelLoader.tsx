'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { INSPECTOR_LOADER_SIZE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// One box for every body panel: a loader that changes shape between them reads as a different kind of wait.
const HopPanelLoader: FC = () => {
  const t = useI18n();

  return (
    <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
      <DialLoader size={INSPECTOR_LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
    </div>
  );
};

export default HopPanelLoader;
