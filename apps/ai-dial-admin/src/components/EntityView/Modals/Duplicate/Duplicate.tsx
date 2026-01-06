import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import { RoutesForCheckingUniqueName } from '@/src/components/EntityListView/CreateEntity/constants';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { getDisplayNameError, getVersionError } from '@/src/components/EntityMainProperties/Properties/utils';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import {
  duplicateModalDescriptionMap,
  getClonedEntityName,
  getCloneTitle,
} from '@/src/utils/entities/duplicate-entity';
import { getNamesConfigurations } from '@/src/utils/entities/filter-names';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';

type ClonedEntity = BaseEntity | DialModel;
interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  names: string[];
  entity: ClonedEntity;
  onClose: () => void;
  onDuplicate: (entity: ClonedEntity) => void;
}

const DuplicateEntity: FC<Props> = ({ onDuplicate, names, view, isModalOpen, onClose, entity }) => {
  const t = useI18n();
  const isSimple = isSimpleEntity(view);
  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedEntity, setEntity] = useState<ClonedEntity>(
    isSimple
      ? { ...entity, name: getClonedEntityName(entity.name) }
      : { ...entity, name: getClonedEntityName(entity.name), displayVersion: void 0 },
  );

  const namesConfiguration = useMemo(() => {
    return getNamesConfigurations(names);
  }, [names]);

  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);
  const [versionError, setVersionError] = useState<string | undefined>(void 0);
  const [isVersionOptional, setIsVersionOptional] = useState<boolean>(true);
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);

  const onValidateVersion = useCallback(
    (fields: Partial<ClonedEntity>, isVersionOptional: boolean, initial?: boolean) => {
      const error = getVersionError(
        isVersionOptional,
        { ...(clonedEntity as DialModel), ...fields },
        namesConfiguration.versionsMap,
        t,
      );
      if (!initial) {
        setVersionError(error);
      }
      dispatch({ type: ValidationActionType.SetField, field: 'displayVersion', isValid: !error });
    },
    [clonedEntity, dispatch, namesConfiguration.versionsMap, t],
  );

  const onValidateDisplayName = useCallback(
    (displayName: string) => {
      const error = getDisplayNameError(
        view,
        displayName,
        namesConfiguration.names,
        t,
        (entity as DialModel).displayVersion,
      );
      setDisplayNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, entity, namesConfiguration.names, t, view],
  );

  const onChangeVersion = useCallback(
    (displayVersion?: string) => {
      onValidateVersion({ displayVersion }, isVersionOptional);
      setEntity({ ...(clonedEntity as DialModel), displayVersion });
    },
    [clonedEntity, isVersionOptional, onValidateVersion],
  );

  const onChangeDisplayName = useCallback(
    (displayName?: string, initial?: boolean) => {
      const isVersionOptional = !namesConfiguration.names.includes(displayName || '');
      onValidateDisplayName(displayName || '');
      if (view === ApplicationRoute.Models) {
        onValidateVersion({ displayName }, isVersionOptional, initial);
      }
      setIsVersionOptional(isVersionOptional);
      setEntity({ ...clonedEntity, displayName });
    },
    [clonedEntity, namesConfiguration.names, onValidateDisplayName, onValidateVersion, view],
  );

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    onChangeDisplayName(clonedEntity.displayName, true);
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDuplicateClick = useCallback(async () => {
    const isUnique = RoutesForCheckingUniqueName.includes(view)
      ? await checkIsUniqueDeploymentName(clonedEntity.name as string)
      : true;
    setIsUniqueNameError(!isUnique);

    if (!isUnique) return;

    onDuplicate(clonedEntity);
  }, [view, clonedEntity, onDuplicate]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="CloneEntity"
      open={isModalOpen}
      onSubmit={onDuplicateClick}
      onCancel={onClose}
      disableSubmitButton={(isUniqueNameError != null && isUniqueNameError) || !isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4">
        {!!duplicateModalDescriptionMap[view] && (
          <div className="text-secondary small mb-4">{t(duplicateModalDescriptionMap[view])}</div>
        )}
        <div className="flex flex-col gap-y-8">
          <IdControl
            entity={clonedEntity}
            isUniqueNameError={isUniqueNameError}
            onChangeEntity={setEntity}
            names={names}
          />
          <DisplayNameControl
            displayName={clonedEntity.displayName}
            onChange={onChangeDisplayName}
            required={true}
            names={names}
          />

          {view === ApplicationRoute.Models && (
            <VersionControl
              view={view}
              title={t(EntityFieldsI18nKey.displayVersion)}
              version={(clonedEntity as DialModel).displayVersion}
              onChange={onChangeVersion}
              error={versionError}
              optional={isVersionOptional}
              hideError={!!displayNameError}
            />
          )}
        </div>
      </div>
    </DialFormPopup>
  );
};
export default DuplicateEntity;
