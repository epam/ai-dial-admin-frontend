import { FC, useEffect, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { DeleteI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';

import Loader from '@/src/components/Common/Loader/Loader';
import Grid from '@/src/components/Grid/Grid';

interface Props {
  template: InterceptorTemplate;
}

const Delete: FC<Props> = ({ template }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [interceptors, setInterceptors] = useState<DialInterceptor[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getInterceptorsList().then((res) => {
      const interceptors = res?.reduce((acc, curr) => {
        if (template.interceptors?.includes(curr.name as string)) {
          acc.push(curr);
        }
        return acc;
      }, [] as DialInterceptor[]);
      setIsLoading(false);
      setInterceptors(interceptors || []);
    });
  }, [template]);

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
            {interceptors?.length === 0 ? (
              <p>{t(DeleteI18nKey.InterceptorTemplateNoInterceptorsTitle)}</p>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
                <Grid rowData={interceptors} columnDefs={SIMPLE_ENTITY_COLUMNS} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Delete;
