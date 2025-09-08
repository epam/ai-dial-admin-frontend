import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { RadioButtonModel } from '@/src/models/radio-button';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { useI18n } from '@/src/locales/client';

import RadioField from '@/src/components/Common/RadioField/RadioField';
import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';
import { getEndpointPostfix } from '@/src/components/ModelView/ModelProperties/utils';

interface Props {
  model: DialModel;
  prefix?: string;
  onChange: (model: DialModel) => void;
}

const ModelEndpoint: FC<Props> = ({ model, prefix, onChange }) => {
  const t = useI18n();

  const modelTypeRadio: RadioButtonModel[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

  const [postfix, setPostfix] = useState('');
  const [name, setName] = useState('');

  const onChangePath = useCallback(
    (value: string) => {
      setName(value);
      onChange({
        ...model,
        source: { ...(model.source as SOURCE_FIELD), completionEndpointPath: `${value}${postfix}` },
      });
    },
    [model, onChange, postfix],
  );

  const onChangeEndpoint = useCallback(
    (value: string) => {
      setName(value);
      onChange({
        ...model,
        endpoint: `${value}${postfix}`,
      });
    },
    [model, onChange, postfix],
  );

  const onChangeType = useCallback(
    (type: string) => {
      const endpoint = `${name}${getEndpointPostfix(type as DialModelType)}`;
      if (prefix) {
        onChange({
          ...model,
          source: {
            ...(model.source as SOURCE_FIELD),
            completionEndpointPath: endpoint,
          },
          type: type as DialModelType,
        });
      } else {
        onChange({
          ...model,
          endpoint,
          type: type as DialModelType,
        });
      }
    },
    [name, prefix, onChange, model],
  );

  useEffect(() => {
    const postfix = getEndpointPostfix(model.type);
    const name = prefix
      ? model.source?.completionEndpointPath?.split(postfix)[0] || ''
      : model.endpoint?.split(postfix)[0] || '';

    setPostfix(postfix);
    setName(name);
  }, [model, prefix]);

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
        {prefix ? (
          <InputWithReadonlyParts
            inputId="endpoint"
            value={name}
            fullValue={`${prefix}${model.source?.completionEndpointPath}`}
            title={t(EntityFieldsI18nKey.endpoint)}
            postfixPart={`/${postfix}`}
            prefixPart={prefix}
            onChange={onChangePath}
          />
        ) : (
          <InputWithReadonlyParts
            inputId="endpoint"
            value={name}
            fullValue={`${model.endpoint}`}
            title={t(EntityFieldsI18nKey.endpoint)}
            postfixPart={`/${postfix}`}
            onChange={onChangeEndpoint}
          />
        )}
      </div>
    </div>
  );
};

export default ModelEndpoint;
