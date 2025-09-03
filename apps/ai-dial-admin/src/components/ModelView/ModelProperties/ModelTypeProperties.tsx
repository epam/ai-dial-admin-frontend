'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioButtonModel } from '@/src/models/radio-button';
import { DialAdapter } from '@/src/models/dial/adapter';
import { useNotification } from '@/src/context/NotificationContext';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { getErrorNotification } from '@/src/utils/notification';
import { getModelContainers } from '@/src/app/[lang]/interceptors/actions';
import SourceField from '@/src/components/SourceField/SourceField';
import { MODELS_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
  view?: ApplicationRoute;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel, view }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [adapters, setAdapters] = useState<DialAdapter[]>([]);

  const modelTypeRadio: RadioButtonModel[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

  useEffect(() => {
    getModelsAdapters().then((res) => {
      if (res.success) {
        setAdapters((res.response as DialAdapter[]) || []);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [setAdapters]);

  const onChangeType = useCallback(
    (type: string) => {
      onChangeModel({ ...model, type: type as DialModelType });
    },
    [model, onChangeModel],
  );

  const onChangeOverrideName = useCallback(
    (overrideName?: string) => {
      onChangeModel({ ...model, overrideName });
    },
    [model, onChangeModel],
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full lg:w-[35%]">
        <RadioField
          radioButtons={modelTypeRadio}
          activeRadioButton={model.type as string}
          elementId="type"
          fieldTitle={t(EntityFieldsI18nKey.type)}
          orientation={RadioFieldOrientation.Row}
          onChange={onChangeType}
        />
      </div>
      <div className="w-full">
        <SourceField
          entity={model}
          onChange={onChangeModel}
          getContainers={getModelContainers}
          elementId={'sourceType'}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={MODELS_SOURCE_ITEMS}
          view={view}
          adapters={adapters}
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
