import { FC, useCallback, useEffect, useMemo } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Switch from '@/src/components/Common/Switch/Switch';
import {
  FeaturesI18nKey,
  TopicsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  TypeI18nKey,
  BasicI18nKey,
} from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme, TypeEntity } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { getUrlError } from '@/src/utils/validation/url-error';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n() as (key: string) => string;
  const types: DropdownItemsModel[] = [
    { id: BasicI18nKey.None, name: t(BasicI18nKey.None) },
    { id: TypeEntity.OBJECT, name: t(TypeI18nKey.Object) },
    { id: TypeEntity.BOOLEAN, name: t(TypeI18nKey.Boolean) },
  ];

  const { dispatch } = useSaveValidationContext();

  const getError = useCallback(
    (key: keyof DialApplicationScheme) => {
      return runner[key] ? getUrlError(runner[key] as string, false, t) : null;
    },
    [runner, t],
  );

  const completionEndpointError = useMemo(() => {
    return getError('dial:applicationTypeCompletionEndpoint');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return getError('dial:applicationTypeConfigurationEndpoint');
  }, [getError]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'configurationEndpoint',
      isValid: !configurationEndpointError,
    });
  }, [configurationEndpointError, t, dispatch]);

  const rateEndpointError = useMemo(() => {
    return getError('dial:applicationTypeRateEndpoint');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'rateEndpoint', isValid: !rateEndpointError });
  }, [rateEndpointError, t, dispatch]);

  const promptEndpointError = useMemo(() => {
    return getError('dial:applicationTypeTruncatePromptEndpoint');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'promptEndpoint', isValid: !promptEndpointError });
  }, [promptEndpointError, t, dispatch]);

  const tokenizeEndpointError = useMemo(() => {
    return getError('dial:applicationTypeTokenizeEndpoint');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'tokenizeEndpoint', isValid: !tokenizeEndpointError });
  }, [tokenizeEndpointError, t, dispatch]);

  const viewerUrlError = useMemo(() => {
    return getError('dial:applicationTypeViewerUrl');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: !viewerUrlError });
  }, [viewerUrlError, t, dispatch]);

  const editorUrlError = useMemo(() => {
    return getError('dial:applicationTypeEditorUrl');
  }, [getError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: !editorUrlError });
  }, [editorUrlError, t, dispatch]);

  const onChange = useCallback(
    (value: string | string[] | boolean, key: keyof DialApplicationScheme) => {
      onChangeRunner({ ...runner, [key]: value });
    },
    [runner, onChangeRunner],
  );

  const onChangeTopics = useCallback(
    (topics: string[]) => {
      onChange(topics, 'topics');
    },
    [onChange],
  );

  const onChangeCompletionEndPoint = useCallback(
    (endpoint: string) => {
      onChange(endpoint, 'dial:applicationTypeCompletionEndpoint');
    },
    [onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeConfigurationEndpoint');
    },
    [onChange],
  );

  const onChangeRateEndpoint = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeRateEndpoint');
    },
    [onChange],
  );

  const onChangePromptEndpoint = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeTruncatePromptEndpoint');
    },
    [onChange],
  );

  const onChangeTokenizeEndpoint = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeTokenizeEndpoint');
    },
    [onChange],
  );

  const onChangeViewerUrl = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeViewerUrl');
    },
    [onChange],
  );

  const onChangeEditorUrl = useCallback(
    (url: string) => {
      onChange(url, 'dial:applicationTypeEditorUrl');
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <EntityIcon
        elementId="icon"
        fieldTitle={t(EntityFieldsI18nKey.icon)}
        iconUrl={runner['dial:applicationTypeIconUrl']}
        onChange={(icon: string) => {
          onChange(icon, 'dial:applicationTypeIconUrl');
        }}
      />
      <TextInputField
        elementId="title"
        fieldTitle={t(EntityFieldsI18nKey.title)}
        placeholder={t(EntityPlaceholdersI18nKey.Title)}
        value={runner.title}
        optional={true}
        onChange={(title: string) => {
          onChangeRunner({ ...runner, title });
        }}
      />

      <div className="lg:w-[35%]">
        <DropdownField
          selectedValue={runner.type || BasicI18nKey.None}
          elementId="type"
          items={types}
          fieldTitle={t(EntityFieldsI18nKey.type)}
          placeholder={t(EntityPlaceholdersI18nKey.Type)}
          onChange={(type: string) => {
            onChangeRunner({ ...runner, type: type === BasicI18nKey.None ? void 0 : (type as TypeEntity) });
          }}
        />
      </div>
      <Multiselect
        elementId="topics"
        selectedItems={runner.topics}
        getItems={getModelsTopics}
        onChangeItems={onChangeTopics}
        heading={t(EntityFieldsI18nKey.topics)}
        title={t(EntityFieldsI18nKey.topics)}
        addPlaceholder={t(EntityPlaceholdersI18nKey.Topic)}
        addTitle={t(TopicsI18nKey.AddTopic)}
      />
      <TextInputField
        elementId="completionEndPoint"
        fieldTitle={t(EntityFieldsI18nKey.completionEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
        value={runner['dial:applicationTypeCompletionEndpoint']}
        errorText={completionEndpointError?.text}
        invalid={!!completionEndpointError}
        onChange={onChangeCompletionEndPoint}
      />
      <TextInputField
        elementId="configurationEndPoint"
        fieldTitle={t(FeaturesI18nKey.configurationEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.ConfigurationEndpoint)}
        value={runner['dial:applicationTypeConfigurationEndpoint']}
        optional={true}
        errorText={configurationEndpointError?.text}
        invalid={!!configurationEndpointError}
        onChange={onChangeConfigurationEndpoint}
      />
      <TextInputField
        elementId="rateEndpoint"
        fieldTitle={t(FeaturesI18nKey.rateEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.RateEndpoint)}
        value={runner['dial:applicationTypeRateEndpoint']}
        optional={true}
        errorText={rateEndpointError?.text}
        invalid={!!rateEndpointError}
        onChange={onChangeRateEndpoint}
      />
      <TextInputField
        elementId="promptEndpoint"
        fieldTitle={t(FeaturesI18nKey.truncatePromptEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TruncatePromptEndpoint)}
        value={runner['dial:applicationTypeTruncatePromptEndpoint']}
        optional={true}
        errorText={promptEndpointError?.text}
        invalid={!!promptEndpointError}
        onChange={onChangePromptEndpoint}
      />
      <TextInputField
        elementId="tokenizeEndpoint"
        fieldTitle={t(FeaturesI18nKey.tokenizeEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TokenizeEndpoint)}
        value={runner['dial:applicationTypeTokenizeEndpoint']}
        optional={true}
        errorText={tokenizeEndpointError?.text}
        invalid={!!tokenizeEndpointError}
        onChange={onChangeTokenizeEndpoint}
      />
      <TextInputField
        elementId="viewerUrl"
        fieldTitle={t(EntityFieldsI18nKey['dial:applicationTypeViewerUrl'])}
        placeholder={t(EntityPlaceholdersI18nKey.ViewerUrl)}
        value={runner['dial:applicationTypeViewerUrl']}
        optional={true}
        errorText={viewerUrlError?.text}
        invalid={!!viewerUrlError}
        onChange={onChangeViewerUrl}
      />
      <TextInputField
        elementId="editorUrl"
        fieldTitle={t(EntityFieldsI18nKey['dial:applicationTypeEditorUrl'])}
        placeholder={t(EntityPlaceholdersI18nKey.EditorUrl)}
        value={runner['dial:applicationTypeEditorUrl']}
        optional={true}
        errorText={editorUrlError?.text}
        invalid={!!editorUrlError}
        onChange={onChangeEditorUrl}
      />
      <Switch
        isOn={runner['dial:appendApplicationPropertiesHeader']}
        title={t(EntityFieldsI18nKey['dial:appendApplicationPropertiesHeader'])}
        switchId="appendApplicationPropertiesHeader"
        onChange={(value: boolean) => {
          onChange(value, 'dial:appendApplicationPropertiesHeader');
        }}
      />
      <Switch
        isOn={runner['dial:applicationTypePlaybackSupport']}
        title={t(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport'])}
        switchId="applicationTypePlaybackSupport"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypePlaybackSupport');
        }}
      />
    </div>
  );
};

export default AppRunnerExtendedProperties;
