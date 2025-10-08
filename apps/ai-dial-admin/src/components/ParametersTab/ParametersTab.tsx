'use client';

import { FC } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import SchemeRenderer from '@/src/components/SchemeRenderer/SchemeRenderer';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  scheme: DialApplicationScheme;
}

const ParametersTab: FC<Props> = ({ scheme }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-auto bg-layer-3 p-4">
      {!scheme ? (
        <DialNoDataContent title={t(BasicI18nKey.NoParameters)} />
      ) : (
        <div className="flex flex-col gap-6">
          <h1>{t(EntityFieldsI18nKey.scheme)}</h1>
          <div className="flex flex-col gap-8">
            <SchemeRenderer scheme={scheme} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametersTab;
