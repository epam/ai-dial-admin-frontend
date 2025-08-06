import { FC, useEffect, useState } from 'react';

import { getModels } from '@/src/app/[lang]/models/actions';
import Loader from '@/src/components/Common/Loader/Loader';
import Grid from '@/src/components/Grid/Grid';
import { DISPLAY_NAME_COLUMN, NAME_COLUMN, VERSION_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { DeleteI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';

interface Props {
  entity: DialAdapter;
  isEntityView?: boolean;
}

const DeleteAdapter: FC<Props> = ({ entity, isEntityView }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<DialModel[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getModels().then((res) => {
      const models = res?.reduce((acc, curr) => {
        if (entity.models?.includes(curr.name as string)) {
          acc.push(curr);
        }
        return acc;
      }, [] as DialModel[]);
      setModels(models || []);

      setIsLoading(false);
    });
  }, [entity]);

  return (
    <div className="flex flex-col text-secondary small-150 px-6 h-[300px]">
      <p>
        <span>{t(DeleteI18nKey.Confirming)}</span>
        {isEntityView ? null : <span className="important-text-part mr-1">{entity.name}</span>}
        <span>{t(DeleteI18nKey.AdapterTitle)}?</span>
      </p>
      <p>{t(DeleteI18nKey.AdapterDescriptionWarning)}</p>
      <div className="flex-1 min-h-0 mt-4 flex flex-col">
        {isLoading ? (
          <Loader size={24} />
        ) : (
          <>
            <h3 className="text-primary mb-1">{t(DeleteI18nKey.AdapterModelsTitle)}</h3>
            {models?.length === 0 ? (
              <p>{t(DeleteI18nKey.AdapterNoModelsTitle)}</p>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
                <Grid rowData={models} columnDefs={[DISPLAY_NAME_COLUMN, NAME_COLUMN, VERSION_COLUMN]} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAdapter;
