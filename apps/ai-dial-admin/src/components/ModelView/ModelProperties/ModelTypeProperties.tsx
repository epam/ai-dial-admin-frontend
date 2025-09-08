'use client';

import { FC, useCallback } from 'react';

import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { getModelContainers } from '@/src/app/[lang]/interceptors/actions';
import { useAppContext } from '@/src/context/AppContext';
import { getSourceItems, MODELS_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { useI18n } from '@/src/locales/client';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import SourceField from '@/src/components/SourceField/SourceField';
import { isDeploymentsEnabled } from '@/src/utils/plugins';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();
  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = isDeploymentsEnabled(embeddedApps);

  const onChangeOverrideName = useCallback(
    (overrideName?: string) => {
      onChangeModel({ ...model, overrideName });
    },
    [model, onChangeModel],
  );
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full">
        <SourceField
          view={ApplicationRoute.Models}
          entity={model}
          elementId={'sourceType'}
          onChange={onChangeModel}
          getContainers={getModelContainers}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(MODELS_SOURCE_ITEMS, deploymentsEnabled)}
          getAdapters={getModelsAdapters}
        />
      </div>
      <div className="w-full flex flex-col gap-6 lg:w-[35%]">
        <TextInputField
          elementId="overrideName"
          fieldTitle={t(EntityFieldsI18nKey.overrideName)}
          placeholder={t(EntityPlaceholdersI18nKey.OverrideName)}
          value={model.overrideName}
          onChange={onChangeOverrideName}
          optional={true}
        />
        {model.type === DialModelType.Chat && (
          <>
            <IconControl iconUrl={model.iconUrl} onChange={(icon) => onChangeModel({ ...model, iconUrl: icon })} />
            <TopicsControl entity={model} onChange={onChangeModel} />
          </>
        )}
      </div>
      {model.type === DialModelType.Chat && <EntityAttachments entity={model} onChangeEntity={onChangeModel} />}
    </div>
  );
};

export default ModelTypeProperties;
