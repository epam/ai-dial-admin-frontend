import { FC, useCallback, useEffect, useMemo } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Switch from '@/src/components/Common/Switch/Switch';
import {
  CreateI18nKey,
  EntitiesI18nKey,
  FeaturesI18nKey,
  TopicsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
} from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme, TypeEntity } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n() as (key: string) => string;
  const types: DropdownItemsModel[] = [
    { id: TypeEntity.OBJECT, name: t(EntitiesI18nKey.ObjectType) },
    { id: TypeEntity.BOOLEAN, name: t(EntitiesI18nKey.BooleanType) },
  ];

  const { dispatch } = useSaveValidationContext();

  const completionEndpointError = useMemo(() => {
    return runner['dial:applicationTypeCompletionEndpoint']
      ? getUrlError(runner['dial:applicationTypeCompletionEndpoint'], false, t)
      : null;
  }, [runner, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return runner['dial:applicationTypeConfigurationEndpoint']
      ? getUrlError(runner['dial:applicationTypeConfigurationEndpoint'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'configurationEndpoint',
      isValid: !configurationEndpointError,
    });
  }, [configurationEndpointError, t, dispatch]);

  const rateEndpointError = useMemo(() => {
    return runner['dial:applicationTypeRateEndpoint']
      ? getUrlError(runner['dial:applicationTypeRateEndpoint'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'rateEndpoint', isValid: !rateEndpointError });
  }, [rateEndpointError, t, dispatch]);

  const promptEndpointError = useMemo(() => {
    return runner['dial:applicationTypeTruncatePromptEndpoint']
      ? getUrlError(runner['dial:applicationTypeTruncatePromptEndpoint'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'promptEndpoint', isValid: !promptEndpointError });
  }, [promptEndpointError, t, dispatch]);

  const tokenizeEndpointError = useMemo(() => {
    return runner['dial:applicationTypeTokenizeEndpoint']
      ? getUrlError(runner['dial:applicationTypeTokenizeEndpoint'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'tokenizeEndpoint', isValid: !tokenizeEndpointError });
  }, [tokenizeEndpointError, t, dispatch]);

  const viewerUrlError = useMemo(() => {
    return runner['dial:applicationTypeViewerUrl']
      ? getUrlError(runner['dial:applicationTypeViewerUrl'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: !viewerUrlError });
  }, [viewerUrlError, t, dispatch]);

  const editorUrlError = useMemo(() => {
    return runner['dial:applicationTypeEditorUrl']
      ? getUrlError(runner['dial:applicationTypeEditorUrl'], false, t)
      : null;
  }, [runner, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: !editorUrlError });
  }, [editorUrlError, t, dispatch]);

  const onChangeTopics = useCallback(
    (topics: string[]) => {
      onChangeRunner({ ...runner, topics });
    },
    [runner, onChangeRunner],
  );

  const onChangeCompletionEndPoint = useCallback(
    (endpoint: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeCompletionEndpoint': endpoint });
    },
    [runner, onChangeRunner],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeConfigurationEndpoint': url });
    },
    [runner, onChangeRunner],
  );

  const onChangeRateEndpoint = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeRateEndpoint': url });
    },
    [runner, onChangeRunner],
  );

  const onChangePromptEndpoint = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeTruncatePromptEndpoint': url });
    },
    [runner, onChangeRunner],
  );

  const onChangeTokenizeEndpoint = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeTokenizeEndpoint': url });
    },
    [runner, onChangeRunner],
  );

  const onChangeViewerUrl = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeViewerUrl': url });
    },
    [runner, onChangeRunner],
  );

  const onChangeEditorUrl = useCallback(
    (url: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeEditorUrl': url });
    },
    [runner, onChangeRunner],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <TextInputField
        elementId="title"
        fieldTitle={t(EntityFieldsI18nKey.title)}
        placeholder={t(EntitiesI18nKey.TitlePlaceholder)}
        value={runner.title}
        optional={true}
        onChange={(title: string) => {
          onChangeRunner({ ...runner, title });
        }}
      />

      <DropdownField
        selectedValue={runner.type}
        elementId="type"
        items={types}
        fieldTitle={t(EntityFieldsI18nKey.type)}
        placeholder={t(EntitiesI18nKey.TypePlaceholder)}
        onChange={(type: string) => {
          onChangeRunner({ ...runner, type: type as TypeEntity });
        }}
      />
      <Multiselect
        elementId="topics"
        selectedItems={runner.topics}
        getItems={getModelsTopics}
        onChangeItems={onChangeTopics}
        heading={t(EntityFieldsI18nKey.topics)}
        title={t(EntityFieldsI18nKey.topics)}
        addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
        addTitle={t(TopicsI18nKey.AddTopic)}
      />

      <TextInputField
        elementId="completionEndPoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
        value={runner['dial:applicationTypeCompletionEndpoint']}
        errorText={completionEndpointError?.text}
        invalid={!!completionEndpointError}
        onChange={onChangeCompletionEndPoint}
      />

      <TextInputField
        elementId="configurationEndPoint"
        fieldTitle={t(FeaturesI18nKey.configurationEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        value={runner['dial:applicationTypeConfigurationEndpoint']}
        optional={true}
        errorText={configurationEndpointError?.text}
        invalid={!!configurationEndpointError}
        onChange={onChangeConfigurationEndpoint}
      />
      <TextInputField
        elementId="rateEndpoint"
        fieldTitle={t(FeaturesI18nKey.rateEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        value={runner['dial:applicationTypeRateEndpoint']}
        optional={true}
        errorText={rateEndpointError?.text}
        invalid={!!rateEndpointError}
        onChange={onChangeRateEndpoint}
      />

      <TextInputField
        elementId="promptEndpoint"
        fieldTitle={t(FeaturesI18nKey.truncatePromptEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        value={runner['dial:applicationTypeTruncatePromptEndpoint']}
        optional={true}
        errorText={promptEndpointError?.text}
        invalid={!!promptEndpointError}
        onChange={onChangePromptEndpoint}
      />

      <TextInputField
        elementId="tokenizeEndpoint"
        fieldTitle={t(FeaturesI18nKey.tokenizeEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
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
          onChangeRunner({ ...runner, 'dial:appendApplicationPropertiesHeader': value });
        }}
      />

      <Switch
        isOn={runner['dial:applicationTypePlaybackSupport']}
        title={t(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport'])}
        switchId="applicationTypePlaybackSupport"
        onChange={(value: boolean) => {
          onChangeRunner({ ...runner, 'dial:applicationTypePlaybackSupport': value });
        }}
      />
    </div>
  );
};

export default AppRunnerExtendedProperties;
