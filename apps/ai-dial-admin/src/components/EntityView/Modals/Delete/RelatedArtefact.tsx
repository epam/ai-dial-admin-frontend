import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import Grid from '@/src/components/Grid/Grid';
import { DISPLAY_NAME_COLUMN, NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getNoRelatedText, getRelatedArtifacts, getRelatedText, getWarningText } from './utils';

interface Props {
  entity: BaseEntity;
  view: ApplicationRoute;
}

const RelatedArtefacts: FC<Props> = ({ entity, view }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<BaseEntity[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getRelatedArtifacts(view, entity).then((entities) => {
      setIsLoading(false);
      setData(entities || []);
    });
  }, [entity, view]);

  return (
    <div className="flex flex-col text-secondary small-150">
      <p>{getWarningText(view, t)}</p>
      <div className="flex-1 min-h-0 mt-4 flex flex-col">
        {isLoading ? (
          <DialLoader size={24} />
        ) : (
          <>
            <h3 className="text-primary mb-1">{getRelatedText(view, t)}</h3>
            {data?.length === 0 ? (
              <p>{getNoRelatedText(view, t)}</p>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
                <Grid rowData={data} columnDefs={[DISPLAY_NAME_COLUMN, NAME_COLUMN]} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RelatedArtefacts;
