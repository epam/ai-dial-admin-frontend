import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { RoutesForCheckingUniqueName } from './constants';
import { DialRoute } from '@/src/models/dial/route';
import { isValidSourceField } from '@/src/components/SourceField/utils';
import { DialModel } from '@/src/models/dial/model';

interface CreatePromptEntity extends BaseEntity {
  version?: string;
  folderId?: string;
}

interface Props<T> {
  route: ApplicationRoute;
  modalState: PopUpState;
  names: string[];
  modalTitle: string;
  runners?: DialApplicationScheme[];
  versionsMap?: Record<string, string[]>;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  onClose: () => void;
  initialValues?: Partial<T>;
}

const CreateEntity = <T extends CreatePromptEntity>({
  modalTitle,
  runners,
  route,
  modalState,
  names,
  versionsMap,
  onClose,
  createEntity,
  initialValues,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { filePath, fetchFiles } = usePromptFolder();
  const { isValid, dispatch } = useSaveValidationContext();

  const { showNotification } = useNotification();

  const [currentEntity, setEntity] = useState<T>(
    route === ApplicationRoute.Models
      ? ({
          name: '',
          description: '',
        } as T)
      : versionsMap
        ? ({ name: '', description: '', version: '1.0.0' } as T)
        : ({ name: '', description: '', ...initialValues } as T),
  );
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);

  const onChangeEntity = useCallback(
    (entity: BaseEntity) => {
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

    if (!isUnique) return;

    if (route === ApplicationRoute.Prompts) {
      entity.folderId = filePath;
    }
    createEntity?.(entity).then((res) => {
      if (res.success) {
        if (route === ApplicationRoute.Prompts) {
          fetchFiles(filePath);
        }
        const originalRoute = route.split('/')[1];
        router.push(`${initialValues ? '/' : ''}${originalRoute}/${getEntityPath(route, res.response || entity)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentEntity, route, createEntity, filePath, router, initialValues, onClose, fetchFiles, showNotification]);

  useEffect(() => {
    setIsUniqueNameError(void 0);
  }, [currentEntity, route, versionsMap, names]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentEntity.name });

    if (route === ApplicationRoute.Models || route === ApplicationRoute.Toolsets) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'source',
        isValid: isValidSourceField(currentEntity as DialModel),
      });
    }

    if (versionsMap) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'version',
        isValid: !!currentEntity.version,
      });
    }

    if (route === ApplicationRoute.Routes) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'path',
        isValid: !!(currentEntity as DialRoute).paths?.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            isModal={true}
            initialValues={initialValues}
          />
        ) : (
          <EntityMainProperties
            view={route}
            runners={runners}
            entity={currentEntity}
            names={names}
            isUniqueNameError={isUniqueNameError}
            onChangeEntity={onChangeEntity}
            isModal={true}
          />
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Create)}
          onClick={onCreate}
          disable={(isUniqueNameError != null && !isUniqueNameError) || !isValid}
        />
      </div>
    </Popup>
  );
};

export default CreateEntity;
