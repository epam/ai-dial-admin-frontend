'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList/BaseAssetList';

const ConversationsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.Conversations} />;
};

export default ConversationsList;
