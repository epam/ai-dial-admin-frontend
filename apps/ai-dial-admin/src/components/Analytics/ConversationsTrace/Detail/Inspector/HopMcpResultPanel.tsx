'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopFactBlock from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopFactBlock';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopMcpFacts, HopReadState, HopSideSuppression } from '@/src/models/analytics/conversations-trace';

interface Props {
  facts: HopMcpFacts | null;
  isLoading: boolean;
  suppression: HopSideSuppression | null;
}

// The response half of an MCP hop: what the tool returned. `resultState` is the read state of the response
// column alone, so a caller granted the arguments and not the result is told which half was withheld rather
// than being shown a hop that appears to have recorded nothing.
const HopMcpResultPanel: FC<Props> = ({ facts, isLoading, suppression }) => {
  const t = useI18n();

  if (suppression !== null) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  if (facts.resultText === null) {
    return <HopStateNote state={facts.resultState} />;
  }

  return (
    <>
      <HopFactBlock label={t(ConversationsTraceI18nKey.InspectorMcpResult)} text={facts.resultText} />
      {/* A `tools/call` result averages 123 KB, so this clamp fires in practice rather than in theory. */}
      <HopClampNote clamp={facts.resultClamp} />
    </>
  );
};

export default HopMcpResultPanel;
