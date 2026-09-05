'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopFactBlock from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopFactBlock';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopProtocolFacts, HopReadState, HopSideSuppression } from '@/src/models/analytics/conversations-trace';

interface Props {
  facts: HopProtocolFacts | null;
  isLoading: boolean;
  suppression: HopSideSuppression | null;
}

const HopProtocolResultPanel: FC<Props> = ({ facts, isLoading, suppression }) => {
  const t = useI18n();

  if (suppression !== null) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  if (facts.resultText === null) {
    return <HopStateNote state={facts.responseState} />;
  }

  return (
    <>
      <HopFactBlock label={t(ConversationsTraceI18nKey.InspectorProtocolResult)} text={facts.resultText} />
      {/* A `tools/list` result carries every tool's schema and reaches hundreds of kilobytes. */}
      <HopClampNote clamp={facts.resultClamp} />
    </>
  );
};

export default HopProtocolResultPanel;
