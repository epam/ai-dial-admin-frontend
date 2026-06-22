import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import { BaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getRelatedArtifacts, getRelatedColumns, getRelatedText, getWarningText } from './utils';
import { useI18n } from '@/src/locales/client';
import GridView from '@/src/components/Grid/GridView/GridView';

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
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <DialLoader size={24} />
        ) : (
          <>
            {!!data?.length && (
              <div className="flex flex-col gap-4">
                <p>{getWarningText(view, t)}</p>
                <div className="flex flex-col gap-2">
                  <h3 className="text-primary">
                    {getRelatedText(view, t)}: {data.length}
                  </h3>
                  <div className="flex-1 min-h-0">
                    <GridView rowData={data} columnDefs={getRelatedColumns(view)} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RelatedArtefacts;
