'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import { splitEndpoint } from '@/src/components/ModelView/ModelProperties/utils';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
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
    (overrideName?: string) => {
      onChangeModel({ ...model, overrideName });
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
      <div className="lg:w-[75%]">
        <InputWithReadonlyParts
          inputId="endpoint"
          value={model.endpointDeploymentName}
          fullValue={`${prefixPart}${model.endpointDeploymentName ? model.endpointDeploymentName + '/' : ''}${postfixPart}`}
          title={t(EntityFieldsI18nKey.endpoint)}
          postfixPart={`/${postfixPart}`}
          prefixPart={prefixPart}
          onChange={onChangeEndpoint}
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
            <EntityIcon
              fieldTitle={t(EntityFieldsI18nKey.iconUrl)}
              elementId="icon"
              iconUrl={model.iconUrl}
              onChange={(icon) => onChangeModel({ ...model, iconUrl: icon })}
            />
            <TopicsControl entity={model} onChange={onChangeModel} />
          </>
        )}
      </div>
      {model.type === DialModelType.Chat && <EntityAttachments entity={model} onChangeEntity={onChangeModel} />}
    </div>
  );
};

export default ModelTypeProperties;
