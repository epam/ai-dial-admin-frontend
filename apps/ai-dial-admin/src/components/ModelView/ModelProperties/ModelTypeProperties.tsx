'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';
import { splitEndpoint } from '@/src/components/ModelView/ModelProperties/utils';
import { DialAdapter } from '@/src/models/dial/adapter';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [adapters, setAdapters] = useState<DialAdapter[]>([]);

  const [prefixPart, postfixPart] = useMemo(() => {
    return splitEndpoint(model, adapters);
  }, [model, adapters]);

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

  const onChangeEndpoint = useCallback(
    (value: string) => {
      onChangeModel({ ...model, endpointDeploymentName: value });
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
      <div className="lg:w-[75%]">
        <InputWithReadonlyParts
          inputId="endpoint"
          value={model.endpointDeploymentName}
          fullValue={`${prefixPart}${model.endpointDeploymentName || '/'}${postfixPart}`}
          title={t(EntitiesI18nKey.Endpoint)}
          postfixPart={`/${postfixPart}`}
          prefixPart={prefixPart}
          onChange={onChangeEndpoint}
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
