'use client';
import { FC, useMemo } from 'react';

import { createApplication, removeApplication } from '@/src/app/[lang]/applications/actions';
import { APPLICATIONS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialApplication[];
  runners: DialApplicationScheme[];
}

const ApplicationsList: FC<Props> = ({ data, runners }) => {
  const names = filterDisplayNamesWithVersions(data);
  const t = useI18n();

  const columns = useMemo(() => APPLICATIONS_COLUMNS(t), [t]);

  return (
    <BaseEntityList
      data={data}
      runners={runners}
      names={names}
      baseColumns={columns}
      route={ApplicationRoute.Applications}
      onCreateEntity={createApplication}
      onRemoveEntity={removeApplication}
      showColumnsButton={true}
    />
  );
};

export default ApplicationsList;
