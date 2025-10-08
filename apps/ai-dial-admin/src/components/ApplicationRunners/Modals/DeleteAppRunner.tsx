import { FC, useEffect, useState } from 'react';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import { DISPLAY_NAME_COLUMN, NAME_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import Grid from '@/src/components/Grid/Grid';
import { DeleteI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  entity: DialApplicationScheme;
  isEntityView?: boolean;
}

const DeleteAppRunner: FC<Props> = ({ entity, isEntityView }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState<DialApplication[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getApplications().then((res) => {
      const apps = res?.reduce((acc, curr) => {
        if (entity.applications?.includes(curr.name as string)) {
          acc.push(curr);
        }
        return acc;
      }, [] as DialApplication[]);
      setIsLoading(false);
      setApplications(apps || []);
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
          <DialLoader size={24} />
        ) : (
          <>
            <h3 className="text-primary mb-1">{t(DeleteI18nKey.ApplicationRunnerApplicationsTitle)}</h3>
            {applications?.length === 0 ? (
              <p>{t(DeleteI18nKey.ApplicationRunnerNoApplicationsTitle)}</p>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
                <Grid rowData={applications} columnDefs={[DISPLAY_NAME_COLUMN, NAME_COLUMN]} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAppRunner;
