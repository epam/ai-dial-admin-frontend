import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantDataForAppRunner } from '@/src/components/AddEntitiesTab/utils';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  appRunner: DialApplicationScheme;
  onChangeAppRunner: (appRunner: DialApplicationScheme) => void;
}

const AppRunnerApplications: FC<Props> = ({ appRunner, onChangeAppRunner }) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());
  const [applications, setApplications] = useState<DialApplication[]>([]);

  useEffect(() => {
    getReqRef.current(getApplications).then((res) => {
      if (res.success) {
        setApplications(res.response || []);
      }
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
      customColumns={BASE_COLUMNS}
    />
  );
};

export default AppRunnerApplications;
