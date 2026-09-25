'use client';

import { FC } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import AssetAppsList from './List';

interface Props {
  runners: DialApplicationScheme[];
}

const AssetsApplicationsPageList: FC<Props> = ({ runners }) => <AssetAppsList runners={runners} />;

export default AssetsApplicationsPageList;
