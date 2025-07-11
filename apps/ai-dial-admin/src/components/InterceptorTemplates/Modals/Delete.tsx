import { FC, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { DeleteI18nKey } from '@/src/constants/i18n';
import { SIMPLE_VERSION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';

import Loader from '@/src/components/Common/Loader/Loader';
import Grid from '@/src/components/Grid/Grid';

interface Props {
  template: InterceptorTemplate;
}

interface GridData {
  displayName?: string;
  version?: string;
}
//TODO: implement filtering by template when interceptors will be connected to templates
const Delete: FC<Props> = ({ template }) => {
  const t = useI18n();

  const [isLoading, __setIsLoading] = useState(false);
  const [rowData, __setRowData] = useState<GridData[]>([]);

  const columnDefs = SIMPLE_VERSION_COLUMNS.map((col) => ({ ...col, resizable: false }));

  return (
    <div className="flex flex-col text-secondary small-150 px-6 max-h-[300px]">
      <p>
        <span>{t(DeleteI18nKey.Confirming)}</span>
        <span className="important-text-part mr-1">{template.name}</span>
        <span>{t(DeleteI18nKey.InterceptorTemplateTitle)}?</span>
      </p>
      <p>{t(DeleteI18nKey.InterceptorTemplateDescriptionWarning)}</p>
      <div className="flex-1 min-h-0 mt-4 flex flex-col">
        {isLoading ? (
          <Loader size={24} />
        ) : (
          <>
            <h3 className="text-primary mb-1">{t(DeleteI18nKey.InterceptorTemplateInterceptorsTitle)}</h3>
            {rowData?.length === 0 ? (
              <p>{t(DeleteI18nKey.InterceptorTemplateNoInterceptorsTitle)}</p>
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

export default Delete;
