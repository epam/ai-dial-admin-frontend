import { FC, useCallback } from 'react';

import { EntityFieldsI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { RadioButtonModel } from '@/src/models/radio-button';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { useI18n } from '@/src/locales/client';

import RadioField from '@/src/components/Common/RadioField/RadioField';
import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';

interface Props {
  model: DialModel;
  prefix?: string;
  onChange: (model: DialModel) => void;
}

const ModelEndpoint: FC<Props> = ({ model, prefix, onChange }) => {
  const t = useI18n();
  const postfix = model.type === DialModelType.Chat ? '/chat/completions' : '/embeddings';

  const onChangePath = useCallback(
    (value: string) => {
      onChange({
        ...model,
        source: { ...(model.source as SOURCE_FIELD), completionEndpointPath: `${value}${postfix}` },
      });
    },
    [model, onChange, postfix],
  );
  const onChangeEndpoint = useCallback(
    (value: string) => {
      onChange({
        ...model,
        endpoint: `${value}${postfix}`,
      });
    },
    [model, onChange, postfix],
  );

  const modelTypeRadio: RadioButtonModel[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

  const onChangeType = useCallback(
    (type: string) => {
      onChange({ ...model, type: type as DialModelType });
    },
    [model, onChange],
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
        {prefix ? (
          <InputWithReadonlyParts
            inputId="endpoint"
            value={model.source?.completionEndpointPath?.split(postfix)[0]}
            fullValue={`${prefix}${model.source?.completionEndpointPath}`}
            title={t(EntityFieldsI18nKey.endpoint)}
            postfixPart={postfix}
            prefixPart={prefix}
            onChange={onChangePath}
          />
        ) : (
          <InputWithReadonlyParts
            inputId="endpoint"
            value={model.endpoint?.split(postfix)[0]}
            fullValue={`${model.endpoint}`}
            title={t(EntityFieldsI18nKey.endpoint)}
            postfixPart={postfix}
            onChange={onChangeEndpoint}
          />
        )}
      </div>
    </div>
  );
};

export default ModelEndpoint;
