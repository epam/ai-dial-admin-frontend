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
  disabled?: boolean;
}

const ModelEndpoint: FC<Props> = ({ entity, prefix, onChange, isModal, disabled }) => {
  const t = useI18n();

  const modelTypeRadio: RadioButtonWithContent[] = [
    { id: DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];
  const responsesPostfix = '/responses';
  const [postfix, setPostfix] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [responsesEndpoint, setResponsesEndpoint] = useState('');

  const endpointError = useMemo(() => {
    return getUrlError(entity.endpoint, t, !entity.responsesEndpoint);
  }, [entity.endpoint, entity.responsesEndpoint, t]);

  const responsesEndpointError = useMemo(() => {
    return getUrlError(entity.responsesEndpoint, t, !entity.endpoint);
  }, [entity.endpoint, entity.responsesEndpoint, t]);

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
        source: {
          ...(entity.source as SOURCE_FIELD),
          completionEndpointPath: value ? `${value || ''}${postfix}` : void 0,
        },
      });
    },
    [entity, onChange, postfix],
  );

  const onChangeResponsesPath = useCallback(
    (value?: string) => {
      setResponsesEndpoint(value || '');
      onChange({
        ...entity,
        source: {
          ...(entity.source as SOURCE_FIELD),
          responsesEndpointPath: value ? `${value || ''}${responsesPostfix}` : void 0,
        },
      });
    },
    [entity, onChange],
  );

  const onChangeEndpoint = useCallback(
    (value?: string) => {
      setEndpoint(value || '');
      onChange({
        ...entity,
        endpoint: value ? `${value || ''}${postfix}` : void 0,
      });
    },
    [entity, onChange, postfix],
  );

  const onChangeResponsesEndpoint = useCallback(
    (value?: string) => {
      setResponsesEndpoint(value || '');
      onChange({
        ...entity,
        responsesEndpoint: value ? `${value || ''}${responsesPostfix}` : void 0,
      });
    },
    [entity, onChange],
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

    const responsesEndpoint = prefix
      ? entity.source?.responsesEndpointPath?.split(responsesPostfix)[0] || ''
      : entity.responsesEndpoint?.split(responsesPostfix)[0] || '';
    setResponsesEndpoint(responsesEndpoint);
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
          disabled={disabled}
        />
      )}

      {prefix ? (
        <ComplexInput
          id="completionEndpoint"
          value={endpoint}
          fullValue={fullValue}
          label={t(EntityFieldsI18nKey.completionEndpoint)}
          postfix={postfix}
          prefix={prefix}
          onChange={onChangePath}
          isFullWidth={isModal}
          disabled={disabled}
        />
      ) : (
        <ComplexInput
          id="completionEndpoint"
          value={endpoint}
          fullValue={fullValue}
          label={t(EntityFieldsI18nKey.completionEndpoint)}
          postfix={postfix}
          isFullWidth={isModal}
          placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
          onChange={onChangeEndpoint}
          error={endpointError?.text}
          invalid={!!endpointError}
          copyable={false}
          disabled={disabled}
        />
      )}

      {prefix ? (
        <ComplexInput
          id="responsesEndpoint"
          value={responsesEndpoint}
          fullValue={`${prefix}${responsesEndpoint}${responsesPostfix}`}
          label={t(EntityFieldsI18nKey.responsesEndpoint)}
          postfix={responsesPostfix}
          prefix={prefix}
          onChange={onChangeResponsesPath}
          isFullWidth={isModal}
          disabled={disabled}
        />
      ) : (
        <ComplexInput
          id="responsesEndpoint"
          value={responsesEndpoint}
          label={t(EntityFieldsI18nKey.responsesEndpoint)}
          postfix={responsesPostfix}
          isFullWidth={isModal}
          placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
          onChange={onChangeResponsesEndpoint}
          error={responsesEndpointError?.text}
          invalid={!!responsesEndpointError}
          copyable={false}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default ModelEndpoint;
