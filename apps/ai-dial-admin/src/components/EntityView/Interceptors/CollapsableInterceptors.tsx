import { ReactNode } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import CollapsableSection from './CollapsableSection';

interface Props<T> {
  entity: T;
  headerButton?: ReactNode;
  localInterceptors?: ReactNode;
}

const CollapsableInterceptors = <T extends { interceptors?: string[] }>({
  entity,
  headerButton,
  localInterceptors,
}: Props<T>) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col gap-5">
      <CollapsableSection title={t(InterceptorsI18nKey.Global)}>
        <DialNoDataContent title={t(EntitiesI18nKey.NoGlobalInterceptors)} />
      </CollapsableSection>
      {(entity as DialApplication).customAppSchemaId && (
        <CollapsableSection title={t(InterceptorsI18nKey.Runner)}>
          <DialNoDataContent title={t(EntitiesI18nKey.NoRunnerInterceptors)} />
        </CollapsableSection>
      )}
      <CollapsableSection
        title={`${t(InterceptorsI18nKey.Local)}: ${entity.interceptors?.length}`}
        headerButton={headerButton}
      >
        {localInterceptors}
      </CollapsableSection>
    </div>
  );
};

export default CollapsableInterceptors;
