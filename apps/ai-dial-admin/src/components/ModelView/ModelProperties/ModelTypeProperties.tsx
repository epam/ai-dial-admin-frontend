'use client';

import { FC, useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import { EntitiesI18nKey, ModelViewI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { useI18n } from '@/src/locales/client';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioButtonModel } from '@/src/models/radio-button';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

  const modelTypeRadio: RadioButtonModel[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

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
      <RadioField
        radioButtons={modelTypeRadio}
        activeRadioButton={model.type as string}
        elementId="type"
        fieldTitle={t(ModelViewI18nKey.Type)}
        orientation={RadioFieldOrientation.Row}
        onChange={onChangeType}
      />
      <ReadonlyField value={model.endpoint} title={t(EntitiesI18nKey.Endpoint)} />
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
            onChangeItems={onChangeItems}
            heading={t(TopicsI18nKey.Topics)}
            title={t(TopicsI18nKey.Topics)}
            addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
            addTitle={t(TopicsI18nKey.AddTopic)}
          />
          <EntityAttachments entity={model} onChangeEntity={onChangeModel} />
        </>
      )}
    </div>
  );
};

export default ModelTypeProperties;
