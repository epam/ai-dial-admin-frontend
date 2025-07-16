import { FC, useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { CreateI18nKey, EntitiesI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n();

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
      <Multiselect
        elementId="topics"
        selectedItems={runner.topics}
        getItems={getModelsTopics}
        onChangeItems={onChangeTopics}
        heading={t(TopicsI18nKey.Topics)}
        title={t(TopicsI18nKey.Topics)}
        addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
        addTitle={t(TopicsI18nKey.AddTopic)}
      />

      <TextInputField
        elementId="completionEndPoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
        value={runner['dial:applicationTypeCompletionEndpoint']}
        onChange={onChangeCompletionEndPoint}
      />

      <TextInputField
        elementId="configurationEndPoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
        value={runner['dial:applicationTypeConfigurationEndpoint']}
        optional={true}
        onChange={(url: string) => {
          onChangeRunner({ ...runner, 'dial:applicationTypeConfigurationEndpoint': url });
        }}
      />
      <TextInputField
        elementId="rateEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
        value={runner['dial:applicationTypeRateEndpoint']}
        optional={true}
        onChange={(url: string) => {
          onChangeRunner({ ...runner, 'dial:applicationTypeRateEndpoint': url });
        }}
      />
      <TextInputField
        elementId="promptEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
        value={runner['dial:applicationTypeTruncatePromptEndpoint']}
        optional={true}
        onChange={(url: string) => {
          onChangeRunner({ ...runner, 'dial:applicationTypeTruncatePromptEndpoint': url });
        }}
      />

      <TextInputField
        elementId="tokenizeEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
        value={runner['dial:applicationTypeTokenizeEndpoint']}
        optional={true}
        onChange={(url: string) => {
          onChangeRunner({ ...runner, 'dial:applicationTypeTokenizeEndpoint': url });
        }}
      />

      <TextInputField
        elementId="viewerUrl"
        fieldTitle={t(CreateI18nKey.ViewerUrlTitle)}
        placeholder={t(CreateI18nKey.ViewerUrlPlaceholder)}
        value={runner['dial:applicationTypeViewerUrl']}
        optional={true}
        onChange={onChangeViewerUrl}
      />
      <TextInputField
        elementId="editorUrl"
        fieldTitle={t(CreateI18nKey.EditorUrlTitle)}
        placeholder={t(CreateI18nKey.EditorUrlPlaceholder)}
        value={runner['dial:applicationTypeEditorUrl']}
        onChange={onChangeEditorUrl}
      />
    </div>
  );
};

export default AppRunnerExtendedProperties;
