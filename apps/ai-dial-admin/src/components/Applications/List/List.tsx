'use client';
import { FC, ReactNode, useMemo } from 'react';

import { createApplication, removeApplication } from '@/src/app/[lang]/applications/actions';
import { APPLICATIONS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialApplication[];
  runners: DialApplicationScheme[];
  /** True when `data` came from Core's config-file population (`config-file-entity-views`), not the admin backend. */
  isConfigFileSource?: boolean;
  headerExtra?: ReactNode;
}

const ApplicationsList: FC<Props> = ({ data, runners, isConfigFileSource, headerExtra }) => {
  const names = filterDisplayNamesWithVersions(data);
  const t = useI18n();
  const { codeAppEditorUrl } = useAppContext();

  const columns = useMemo(() => APPLICATIONS_COLUMNS(t, codeAppEditorUrl), [t, codeAppEditorUrl]);

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
      isConfigFileSource={isConfigFileSource}
      headerExtra={headerExtra}
    />
  );
};

export default ApplicationsList;
