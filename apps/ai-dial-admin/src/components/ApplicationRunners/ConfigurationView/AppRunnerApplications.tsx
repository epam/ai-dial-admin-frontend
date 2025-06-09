import { FC, useCallback, useEffect, useState } from 'react';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantDataForAppRunner } from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { ENTITY_BASE_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesGridData } from '@/src/models/entities-grid-data';

interface Props {
  appRunner: DialApplicationScheme;
  onChangeAppRunner: (appRunner: DialApplicationScheme) => void;
}

const AppRunnerApplications: FC<Props> = ({ appRunner, onChangeAppRunner }) => {
  const t = useI18n();

  const [applications, setApplications] = useState<DialApplication[]>([]);

  useEffect(() => {
    getApplications().then((res) => {
      setApplications(res || []);
    });
  }, [appRunner]);

  const onAddApplications = useCallback(
    (rows: EntitiesGridData[]) => {
      const newEntities = rows.map((row) => row.name as string);
      const newRunner = {
        ...appRunner,
        applications: [...(appRunner.applications || []), ...newEntities],
      };
      onChangeAppRunner(newRunner);
    },
    [onChangeAppRunner, appRunner],
  );

  const onRemoveApplication = useCallback(
    (row: EntitiesGridData) => {
      const appToRemove = row.name as string;
      const newRunner = {
        ...appRunner,
        applications: appRunner.applications?.filter((app) => app !== appToRemove) ?? [],
      };
      onChangeAppRunner(newRunner);
    },
    [onChangeAppRunner, appRunner],
  );

  return (
    <AddEntitiesView
      viewTitle={t(TabsI18nKey.Applications)}
      emptyDataTitle={t(EntitiesI18nKey.NoApplications)}
      applications={applications}
      getRelevantDataForEntity={getRelevantDataForAppRunner.bind(this, appRunner)}
      onAdd={onAddApplications}
      onRemove={onRemoveApplication}
      customColumns={ENTITY_BASE_COLUMNS}
    />
  );
};

export default AppRunnerApplications;
