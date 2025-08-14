'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import { EntitiesI18nKey, ModelViewI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { useI18n } from '@/src/locales/client';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioButtonModel } from '@/src/models/radio-button';
import { DialAdapter } from '@/src/models/dial/adapter';
import { useNotification } from '@/src/context/NotificationContext';
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
    (overrideName: string) => {
      onChangeModel({ ...model, overrideName });
    },
    [model, onChangeModel],
  );

  const onChangeItems = useCallback(
    (topics: string[]) => {
      onChangeModel({ ...model, topics });
    },
    [model, onChangeModel],
  );

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="w-full lg:w-[35%]">
        <RadioField
          radioButtons={modelTypeRadio}
          activeRadioButton={model.type as string}
          elementId="type"
          fieldTitle={t(ModelViewI18nKey.Type)}
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
      <div className="w-full flex flex-col gap-5 lg:w-[35%]">
        <TextInputField
          elementId="overrideName"
          fieldTitle={t(ModelViewI18nKey.OverrideName)}
          placeholder={t(ModelViewI18nKey.OverrideNamePlaceholder)}
          value={model.overrideName}
          onChange={onChangeOverrideName}
          optional={true}
        />
        {model.type === DialModelType.Chat && (
          <>
            <EntityIcon
              fieldTitle={t(EntitiesI18nKey.Icon)}
              elementId="icon"
              entity={model}
              onChangeEntity={onChangeModel}
            />
            <Multiselect
              elementId="topics"
              selectedItems={model.topics}
              getItems={getModelsTopics}
              allItems={model.topics}
              optional={true}
              onChangeItems={onChangeItems}
              heading={t(TopicsI18nKey.Topics)}
              title={t(TopicsI18nKey.Topics)}
              addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
              addTitle={t(TopicsI18nKey.AddTopic)}
            />
          </>
        )}
      </div>
      {model.type === DialModelType.Chat && (
        <div className="w-full flex flex-col gap-5 lg:w-[75%]">
          <EntityAttachments entity={model} onChangeEntity={onChangeModel} />
        </div>
      )}
    </div>
  );
};

export default ModelTypeProperties;
