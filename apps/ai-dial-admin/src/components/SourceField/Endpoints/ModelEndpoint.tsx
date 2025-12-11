import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialRadioGroup, RadioGroupOrientation, RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';
import { useI18n } from '@/src/locales/client';
import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { addTrailingSlash, removeSlash } from '@/src/utils/url';

interface Props {
  entity: DialModel;
  prefix?: string;
  onChange: (model: DialModel) => void;
  isModal?: boolean;
}

const ModelEndpoint: FC<Props> = ({ entity, prefix, onChange, isModal }) => {
  const t = useI18n();

  const modelTypeRadio: RadioButtonWithContent[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

  const [postfix, setPostfix] = useState('');
  const [name, setName] = useState('');
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);
  const fullValue = useMemo(() => {
    return prefix ? `${addTrailingSlash(prefix)}${removeSlash(entity.endpoint || '')}` : entity.endpoint || '';
  }, [entity.endpoint, prefix]);

  const onChangePath = useCallback(
    (value?: string) => {
      setName(value || '');
      onChange({
        ...entity,
        source: { ...(entity.source as SOURCE_FIELD), completionEndpointPath: `${value || ''}${postfix}` },
      });
    },
    [entity, onChange, postfix],
  );

  const onChangeEndpoint = useCallback(
    (value?: string) => {
      const error = getUrlError(value, t, true);
      setEndpointError(error);
      setName(value || '');
      onChange({
        ...entity,
        endpoint: `${value || ''}${postfix}`,
      });
    },
    [entity, onChange, postfix, t],
  );

  const onChangeType = useCallback(
    (type: string) => {
      const endpoint = `${name}${getEndpointPostfix(type as DialModelType)}`;
      if (prefix) {
        onChange({
          ...entity,
          source: {
            ...(entity.source as SOURCE_FIELD),
            completionEndpointPath: endpoint,
          },
          type: type as DialModelType,
        });
      } else {
        onChange({
          ...entity,
          endpoint,
          type: type as DialModelType,
        });
      }
    },
    [name, prefix, onChange, entity],
  );

  useEffect(() => {
    const postfix = getEndpointPostfix(isModal ? DialModelType.Chat : entity.type);
    const name = prefix
      ? entity.source?.completionEndpointPath?.split(postfix)[0] || ''
      : entity.endpoint?.split(postfix)[0] || '';

    setPostfix(postfix);
    setName(name);
  }, [isModal, entity, prefix]);

  return (
    <div className="flex flex-col gap-y-8">
      {!isModal && (
        <DialRadioGroup
          radioButtons={modelTypeRadio}
          activeRadioButton={entity.type as string}
          elementId="type"
          fieldTitle={t(EntityFieldsI18nKey.type)}
          orientation={RadioGroupOrientation.Row}
          onChange={onChangeType}
        />
      )}

      {prefix ? (
        <ComplexInput
          elementId="endpoint"
          value={name}
          fullValue={fullValue}
          fieldTitle={t(EntityFieldsI18nKey.endpoint)}
          suffix={postfix}
          textBeforeInput={prefix}
          onChange={onChangePath}
          isFullWidth={isModal}
        />
      ) : (
        <ComplexInput
          elementId="endpoint"
          value={name}
          fullValue={fullValue}
          fieldTitle={t(EntityFieldsI18nKey.endpoint)}
          suffix={postfix}
          isFullWidth={isModal}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          onChange={onChangeEndpoint}
          errorText={endpointError?.text}
          invalid={!!endpointError}
          copyable={false}
        />
      )}
    </div>
  );
};

export default ModelEndpoint;
