'use client';

import { FC } from 'react';
import { ApplicationRoute } from '@/src/types/routes';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationsList from '@/src/components/PublicationsList/PublicationsList';

interface Props {
  data: Publication[];
}

const PublicationsFileList: FC<Props> = ({ data }) => {
  return <BasePublicationsList data={data} route={ApplicationRoute.FilePublications} dataTestId={'publication-list'} />;
};

export default PublicationsFileList;
