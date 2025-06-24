import { FC, useEffect, useState } from 'react';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import Loader from '@/src/components/Common/Loader/Loader';
import { SIMPLE_VERSION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import Grid from '@/src/components/Grid/Grid';
import { DeleteI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  entity: DialApplicationScheme;
  isEntityView?: boolean;
}

interface GridData {
  displayName?: string;
  version?: string;
}

const DeleteScheme: FC<Props> = ({ entity, isEntityView }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [rowData, setRowData] = useState<GridData[]>([]);

  const columnDefs = SIMPLE_VERSION_COLUMNS.map((col) => ({ ...col, resizable: false }));

  useEffect(() => {
    setIsLoading(true);
    getApplications().then((res) => {
      const apps = res?.reduce((acc, curr) => {
        if (entity.applications?.includes(curr.name as string)) {
          acc.push({
            displayName: curr.displayName,
            version: curr.displayVersion,
          });
        }
        return acc;
      }, [] as GridData[]);
      setIsLoading(false);
      setRowData(apps || []);
    });
  }, [entity]);

  return (
    <div className="flex flex-col text-secondary small-150 px-6 h-[300px]">
      <p>
        <span>{t(DeleteI18nKey.Confirming)}</span>
        {isEntityView ? null : (
          <span className="important-text-part mr-1">{entity['dial:applicationTypeDisplayName']}</span>
        )}
        <span>{t(DeleteI18nKey.ApplicationRunnerTitle)}?</span>
      </p>
      <p>{t(DeleteI18nKey.ApplicationRunnerDescriptionWarning)}</p>
      <div className="flex-1 min-h-0 mt-4 flex flex-col">
        {isLoading ? (
          <Loader size={24} />
        ) : (
          <>
            <h3 className="text-primary mb-1">{t(DeleteI18nKey.ApplicationRunnerApplicationsTitle)}</h3>
            {rowData?.length === 0 ? (
              <p>{t(DeleteI18nKey.ApplicationRunnerNoApplicationsTitle)}</p>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
                <Grid rowData={rowData} columnDefs={columnDefs} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteScheme;
