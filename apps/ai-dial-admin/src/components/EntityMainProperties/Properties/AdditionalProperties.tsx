'use client';

import { FC } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { getSchemaSourceId } from '@/src/utils/entities/application-source';
import { ApplicationRoute } from '@/src/types/routes';
import { Toolset } from '@/src/models/dial/toolset';
import { useI18n } from '@/src/locales/client';

import ReadonlyInput from '@/src/components/Common/ReadonlyInput/ReadonlyInput';
import MaintainerControl from '@/src/components/BaseControls/Maintainer';
import IconControl from '@/src/components/BaseControls/Icon';
import TopicsControl from '@/src/components/BaseControls/Topics';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  view: ApplicationRoute;
  entity: ChatEntity;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: ChatEntity) => void;
}

const AdditionalProperties: FC<Props> = ({ view, entity, runners, onChangeEntity, isEntityImmutable = false }) => {
  const t = useI18n();

  const applicationRunner = runners?.find(
    (runner) => runner.$id === getSchemaSourceId((entity as DialApplication).source),
  );

  const isShowCompletionEndpoint = view === ApplicationRoute.Applications && !!applicationRunner;
  const isShowMaintainer =
    view === ApplicationRoute.Applications ||
    view === ApplicationRoute.Models ||
    view === ApplicationRoute.Interceptors ||
    view === ApplicationRoute.Toolsets;

  if ((!isShowMaintainer && !isShowCompletionEndpoint) || !isEntityImmutable) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-y-8">
      {isEntityImmutable && isShowMaintainer ? (
        <MaintainerControl entity={entity} onChangeEntity={onChangeEntity} />
      ) : null}

      {isShowCompletionEndpoint && isEntityImmutable ? (
        <ReadonlyInput
          value={applicationRunner['dial:applicationTypeCompletionEndpoint']}
          label={t(EntityFieldsI18nKey.completionEndpoint)}
          containerClassName={STANDARD_CONTROL_WIDTH}
        />
      ) : null}
      {view == ApplicationRoute.Toolsets && isEntityImmutable && (
        <>
          <IconControl iconUrl={entity.iconUrl} onChange={(icon) => onChangeEntity({ ...entity, iconUrl: icon })} />
          <TopicsControl
            entity={{ topics: (entity as Toolset)?.descriptionKeywords }}
            onChange={({ topics }) => {
              onChangeEntity({ ...entity, descriptionKeywords: topics } as Toolset);
            }}
          />
        </>
      )}
    </div>
  );
};

export default AdditionalProperties;
