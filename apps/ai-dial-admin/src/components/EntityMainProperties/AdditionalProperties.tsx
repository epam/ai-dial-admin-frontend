'use client';

import { FC } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';

import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';

interface Props {
  view: ApplicationRoute;
  entity: ChatEntity;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: ChatEntity) => void;
  isModal?: boolean;
}

const AdditionalProperties: FC<Props> = ({
  view,
  entity,
  runners,
  onChangeEntity,
  isEntityImmutable = false,
  isModal,
}) => {
  const t = useI18n() as (str: string, param?: Record<string, number>) => string;

  const applicationRunner = runners?.find((runner) => runner.$id === (entity as DialApplication).customAppSchemaId);

  const isShowCompletionEndpoint = view === ApplicationRoute.Applications && !!applicationRunner;
  const isShowMaintainer =
    view === ApplicationRoute.Applications ||
    view === ApplicationRoute.Models ||
    view === ApplicationRoute.Interceptors ||
    view === ApplicationRoute.Toolsets;

  if ((!isShowMaintainer && !isShowCompletionEndpoint) || isModal) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col lg:w-[35%] gap-6">
        {isEntityImmutable && isShowMaintainer ? (
          <MaintainerControl entity={entity} onChangeEntity={onChangeEntity} />
        ) : null}

        {isShowCompletionEndpoint && isEntityImmutable ? (
          <ReadonlyField
            value={applicationRunner['dial:applicationTypeCompletionEndpoint']}
            title={t(EntityFieldsI18nKey.completionEndpoint)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default AdditionalProperties;
