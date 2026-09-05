'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
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

// The request half of an MCP hop: what the model asked the tool for. Read from the request column, so it is
// stated here rather than beside the result — a reader entitled to one column and not the other finds the
// half they have where every other request is stated.
const HopMcpArgumentsPanel: FC<Props> = ({ facts, isLoading, suppression }) => {
  const t = useI18n();

  if (suppression !== null) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  if (facts.argumentsText === null) {
    return <HopStateNote state={facts.argumentsState} />;
  }

  return <HopFactBlock label={t(ConversationsTraceI18nKey.InspectorMcpArguments)} text={facts.argumentsText} />;
};

export default HopMcpArgumentsPanel;
