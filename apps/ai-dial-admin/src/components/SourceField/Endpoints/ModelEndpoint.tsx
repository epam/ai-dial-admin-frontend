import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialRadioGroup, RadioGroupOrientation, RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';
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
  const [endpoint, setEndpoint] = useState('');

  const endpointError = useMemo(() => {
    return getUrlError(entity.endpoint, t, true);
  }, [entity.endpoint, t]);

  const fullValue = useMemo(() => {
    if (prefix) {
      return `${addTrailingSlash(prefix)}${removeSlash(endpoint)}`;
    }
    return entity.endpoint || '';
  }, [entity.endpoint, prefix, endpoint]);

  const onChangePath = useCallback(
    (value?: string) => {
      setEndpoint(value || '');
      onChange({
        ...entity,
        source: { ...(entity.source as SOURCE_FIELD), completionEndpointPath: `${value || ''}${postfix}` },
      });
    },
    [entity, onChange, postfix],
  );

  const onChangeEndpoint = useCallback(
    (value?: string) => {
      setEndpoint(value || '');
      onChange({
        ...entity,
        endpoint: `${value || ''}${postfix}`,
      });
    },
    [entity, onChange, postfix],
  );

  const onChangeType = useCallback(
    (type: string) => {
      const value = `${endpoint}${getEndpointPostfix(type as DialModelType)}`;
      if (prefix) {
        onChange({
          ...entity,
          source: {
            ...(entity.source as SOURCE_FIELD),
            completionEndpointPath: value,
          },
          type: type as DialModelType,
        });
      } else {
        onChange({
          ...entity,
          endpoint: value,
          type: type as DialModelType,
        });
      }
    },
    [endpoint, prefix, onChange, entity],
  );

  useEffect(() => {
    const postfix = getEndpointPostfix(isModal ? DialModelType.Chat : entity.type);
    const name = prefix
      ? entity.source?.completionEndpointPath?.split(postfix)[0] || ''
      : entity.endpoint?.split(postfix)[0] || '';

    setPostfix(postfix);
    setEndpoint(name);
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
          id="endpoint"
          value={endpoint}
          fullValue={fullValue}
          label={t(EntityFieldsI18nKey.endpoint)}
          suffix={postfix}
          textBeforeInput={prefix}
          onChange={onChangePath}
          isFullWidth={isModal}
        />
      ) : (
        <ComplexInput
          elementId="endpoint"
          value={endpoint}
          fullValue={fullValue}
          label={t(EntityFieldsI18nKey.endpoint)}
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
