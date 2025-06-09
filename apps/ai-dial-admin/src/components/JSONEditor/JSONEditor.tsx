import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { clearResolvedErrors } from '@/src/components/JSONEditor/JSONEditor.utils';
import { useNotification } from '@/src/context/NotificationContext';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { DialPrompt } from '@/src/models/dial/prompt';

interface Props {
  model: DialBaseEntity;
  errorNotifications: JSONEditorErrorNotification[];
  setSelectedEntity:
    | Dispatch<SetStateAction<DialBaseEntity>>
    | Dispatch<SetStateAction<DialPrompt>>
    | Dispatch<SetStateAction<DialRole>>
    | Dispatch<SetStateAction<DialInterceptor>>
    | Dispatch<SetStateAction<DialKey>>;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setJsonErrors?: Dispatch<SetStateAction<JSONEditorError[]>>;
}

// TODO: Translations
const JSONEditor: FC<Props> = ({ model, errorNotifications, setSelectedEntity, setIsChanged, setJsonErrors }) => {
  const { removeNotification } = useNotification();
  const [entityModel, setEntityModel] = useState<string>('');

  useEffect(() => {
    if (model) {
      setEntityModel(JSON.stringify(model, null, 4));
    }
  }, [model, setEntityModel]);

  const onChangeJSON = useCallback(
    (updatedConfig?: string) => {
      if (updatedConfig) {
        try {
          setSelectedEntity(JSON.parse(updatedConfig));
        } catch (error) {
          if (error) {
            setIsChanged?.(true);
          }
        }
      }
    },
    [setSelectedEntity, setIsChanged],
  );

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      clearResolvedErrors({ errorNotifications, errors, removeNotification });
      setJsonErrors?.(errors ?? []);
    },
    [setJsonErrors, errorNotifications, removeNotification],
  );

  if (!entityModel) {
    return null;
  }

  return <JsonEditorBase value={entityModel} onChange={onChangeJSON} onValidateJSON={onValidateJSON} />;
};

export default JSONEditor;
