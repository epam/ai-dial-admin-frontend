'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import SourceEntitySelector from '@/src/components/EntityMainProperties/SourceEntitySelector/SourceEntitySelector';
import { SIMPLE_DESCRIPTION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  view: ApplicationRoute;
  entity: DialBaseEntity;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const AdditionalProperties: FC<Props> = ({ view, entity, runners, onChangeEntity, isEntityImmutable = false }) => {
  const t = useI18n() as (str: string, param?: Record<string, number>) => string;
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [adapters, setAdapters] = useState<DialAdapter[]>([]);

  const applicationRunner = runners?.find((runner) => runner.$id === (entity as DialApplication).customAppSchemaId);

  const isShowCompletionEndpoint = view === ApplicationRoute.Applications && !!applicationRunner;
  const isShowMaintainer =
    view === ApplicationRoute.Applications || view === ApplicationRoute.Models || ApplicationRoute.Interceptors;

  useEffect(() => {
    getModelsAdapters().then((res) => {
      if (res.success) {
        setAdapters((res.response as DialAdapter[]) || []);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [setAdapters]);

  const onChangeAdapter = useCallback(
    (adapter?: string) => {
      onChangeEntity({ ...entity, adapter });
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col lg:w-[35%] gap-6 mt-4">
        {isEntityImmutable && isShowMaintainer ? (
          <TextInputField
            elementId="author"
            fieldTitle={t(EntitiesI18nKey.Maintainer)}
            placeholder={t(EntitiesI18nKey.MaintainerPlaceholder)}
            value={entity.author}
            optional={true}
            onChange={(author) => onChangeEntity({ ...entity, author })}
          />
        ) : null}

        {isShowCompletionEndpoint && isEntityImmutable ? (
          <ReadonlyField
            value={applicationRunner['dial:applicationTypeCompletionEndpoint']}
            title={t(CreateI18nKey.CompletionEndpointTitle)}
          />
        ) : null}
      </div>

      {view === ApplicationRoute.Models ? (
        <SourceEntitySelector
          route={ApplicationRoute.Adapters}
          buttonTitle={t(ButtonsI18nKey.OpenAdapter)}
          columns={SIMPLE_DESCRIPTION_COLUMNS}
          selectedValue={entity.adapter}
          fieldTitle={t(CreateI18nKey.AdapterTitle)}
          placeholder={t(CreateI18nKey.AdapterPlaceholder)}
          onChangeValue={onChangeAdapter}
          isEntityImmutable={isEntityImmutable}
          sourceEntities={adapters}
        />
      ) : null}
    </div>
  );
};

export default AdditionalProperties;
