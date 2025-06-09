import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { clearSchemeForEditor } from './AppRunnerProperties.utils';

interface Props {
  scheme: DialApplicationScheme;
  onChangeScheme: (scheme: DialApplicationScheme) => void;
}

const SchemeParameters: FC<Props> = ({ scheme, onChangeScheme }) => {
  const t = useI18n();

  const [editorScheme, setEditorScheme] = useState<DialApplicationScheme>(clearSchemeForEditor(scheme));

  const onChangeCompletionEndPoint = useCallback(
    (endpoint: string) => {
      onChangeScheme({ ...scheme, 'dial:applicationTypeCompletionEndpoint': endpoint });
    },
    [scheme, onChangeScheme],
  );

  const onChangeViewerUrl = useCallback(
    (url: string) => {
      onChangeScheme({ ...scheme, 'dial:applicationTypeViewerUrl': url });
    },
    [scheme, onChangeScheme],
  );

  const onChangeEditorUrl = useCallback(
    (url: string) => {
      onChangeScheme({ ...scheme, 'dial:applicationTypeEditorUrl': url });
    },
    [scheme, onChangeScheme],
  );

  useEffect(() => {
    onChangeScheme({ ...scheme, ...editorScheme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorScheme]);

  return (
    <div className="flex flex-col h-full w-full mt-3">
      <div className="flex flex-col gap-6 w-full lg:w-[35%]">
        <TextInputField
          elementId="completionEndPoint"
          fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
          placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
          value={scheme['dial:applicationTypeCompletionEndpoint']}
          onChange={onChangeCompletionEndPoint}
        />
        <TextInputField
          elementId="viewerUrl"
          fieldTitle={t(CreateI18nKey.ViewerUrlTitle)}
          placeholder={t(CreateI18nKey.ViewerUrlPlaceholder)}
          value={scheme['dial:applicationTypeViewerUrl']}
          optional={true}
          onChange={onChangeViewerUrl}
        />
        <TextInputField
          elementId="editorUrl"
          fieldTitle={t(CreateI18nKey.EditorUrlTitle)}
          placeholder={t(CreateI18nKey.EditorUrlPlaceholder)}
          value={scheme['dial:applicationTypeEditorUrl']}
          onChange={onChangeEditorUrl}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0 mt-3 w-full">
        <h1 className="mb-3">{t(CreateI18nKey.SchemeTitle)}</h1>

        <JSONEditor key={0} model={editorScheme} setSelectedEntity={setEditorScheme} errorNotifications={[]} />
      </div>
    </div>
  );
};

export default SchemeParameters;
