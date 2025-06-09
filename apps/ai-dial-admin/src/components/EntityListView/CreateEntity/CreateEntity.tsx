import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { isValidEntity } from './validation';
import { checkIsUniqueDeploymentName } from '@/src/app/actions';

interface Props {
  route: ApplicationRoute;
  modalState: PopUpState;
  names: string[];
  modalTitle: string;
  runners?: DialApplicationScheme[];
  versionsMap?: Record<string, string[]>;
  createEntity: (entity: DialBaseEntity) => Promise<ServerActionResponse>;
  onClose: () => void;
}

const RoutesForCheckingUniqueName = [
  ApplicationRoute.Models,
  ApplicationRoute.Applications,
  ApplicationRoute.Assistants,
  ApplicationRoute.Addons,
  ApplicationRoute.Routes,
];

const CreateEntity: FC<Props> = ({
  modalTitle,
  runners,
  route,
  modalState,
  names,
  versionsMap,
  onClose,
  createEntity,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { filePath, fetchFiles } = usePromptFolder();

  const { showNotification } = useNotification();

  const [currentEntity, setEntity] = useState<DialBaseEntity>(
    versionsMap
      ? { name: '', description: '', version: '1.0.0' }
      : {
          name: '',
          description: '',
          displayVersion: '',
          endpoint: '',
        },
  );
  const [isValid, setIsValid] = useState(false);
  const [isUniqueNameError, setIsUniqueNameError] = useState(false);

  const onChangeEntity = useCallback(
    (entity: DialBaseEntity) => {
      setEntity({ ...currentEntity, ...entity });
    },
    [currentEntity, setEntity],
  );

  const onCreate = useCallback(async () => {
    const entity = {
      ...currentEntity,
      name: currentEntity.name?.trim(),
    };
    const isUnique = RoutesForCheckingUniqueName.includes(route)
      ? await checkIsUniqueDeploymentName(entity.name as string)
      : true;

    setIsUniqueNameError(!isUnique);
    if (!isUnique) {
      setIsValid(false);
      return;
    }
    if (route === ApplicationRoute.Prompts) {
      (entity as DialPrompt).folderId = filePath;
    }
    createEntity(entity).then((res) => {
      if (res.success) {
        if (route === ApplicationRoute.Prompts) {
          fetchFiles(filePath);
        }
        const originalRoute = route.split('/')[1];
        router.push(`${originalRoute}/${getEntityPath(route, res.response || entity)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentEntity, showNotification, fetchFiles, filePath, onClose, route, router, createEntity]);

  useEffect(() => {
    setIsValid(isValidEntity(route, currentEntity, !!versionsMap, names));
    setIsUniqueNameError(false);
  }, [currentEntity, route, versionsMap, names]);

  return (
    <Popup onClose={onClose} heading={modalTitle} portalId="CreateEntity" state={modalState}>
      <div className="flex flex-col overflow-auto px-6 py-4">
        {isSimpleEntity(route) ? (
          <SimpleEntityProperties
            view={route}
            entity={currentEntity}
            names={names}
            onChangeEntity={onChangeEntity}
            versionsMap={versionsMap}
          />
        ) : (
          <EntityMainProperties
            view={route}
            runners={runners}
            entity={currentEntity}
            names={names}
            isUniqueNameError={isUniqueNameError}
            onChangeEntity={onChangeEntity}
          />
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={onCreate} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default CreateEntity;
