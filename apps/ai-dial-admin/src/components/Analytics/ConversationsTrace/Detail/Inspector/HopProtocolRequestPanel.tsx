'use client';

import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
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

// A request carrying no parameters is stated as that fact: "this hop recorded nothing" made the protocol
// methods look like a gap in the log rather than a message with nothing in it.
const HopProtocolRequestPanel: FC<Props> = ({ facts, isLoading, suppression }) => {
  const t = useI18n();

  if (suppression !== null) {
    return <HopStateNote state={HopReadState.ColumnWithheld} suppression={suppression} />;
  }

  if (isLoading || facts === null) {
    return <HopPanelLoader />;
  }

  if (facts.requestText === null) {
    return facts.requestState === HopReadState.NoBody ? (
      <HopStateNote messageKey={ConversationsTraceI18nKey.InspectorProtocolNoParams} />
    ) : (
      <HopStateNote state={facts.requestState} />
    );
  }

  return <HopFactBlock label={t(ConversationsTraceI18nKey.InspectorProtocolParams)} text={facts.requestText} />;
};

export default HopProtocolRequestPanel;
