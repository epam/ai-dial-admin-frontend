'use client';
import { FC } from 'react';

import { createApplication, removeApplication } from '@/src/app/[lang]/applications/actions';
import { APPLICATIONS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { filterDisplayNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialApplication[];
  runners: DialApplicationScheme[];
}

const ApplicationsList: FC<Props> = ({ data, runners }) => {
  const names = filterDisplayNames(data);
  const t = useI18n();

  return (
    <BaseEntityList
      data={data}
      runners={runners}
      names={names}
      baseColumns={APPLICATIONS_COLUMNS(t)}
      route={ApplicationRoute.Applications}
      onCreateEntity={createApplication}
      onRemoveEntity={removeApplication}
      showColumnsButton={true}
    />
  );
};

export default ApplicationsList;
