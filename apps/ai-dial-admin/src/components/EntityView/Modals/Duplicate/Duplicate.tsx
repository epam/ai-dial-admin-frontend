import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import {
  duplicateModalDescriptionMap,
  getClonedEntityName,
  getCloneTitle,
} from '@/src/utils/entities/duplicate-entity';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { RoutesForCheckingUniqueName } from '@/src/components/EntityListView/CreateEntity/constants';
import { checkIsUniqueDeploymentName } from '@/src/app/actions';

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
  const t = useI18n() as (t: string, props?: Record<string, string>) => string;
  const isSimple = isSimpleEntity(view);
  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedEntity, setEntity] = useState<ClonedEntity>(
    isSimple
      ? { ...entity, name: getClonedEntityName(entity.name) }
      : { ...entity, name: getClonedEntityName(entity.name), displayVersion: void 0, displayName: void 0 },
  );
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);

  const onChangeVersion = useCallback(
    (displayVersion?: string) => {
      setEntity({ ...(clonedEntity as DialModel), displayVersion });
    },
    [setEntity, clonedEntity],
  );

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setEntity({ ...clonedEntity, displayName });
    },
    [setEntity, clonedEntity],
  );

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!clonedEntity.displayName });
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
      title={t(getCloneTitle(view, t))}
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
        <div className="flex flex-col gap-6">
          <IdControl
            entity={clonedEntity}
            isUniqueNameError={isUniqueNameError}
            onChangeEntity={setEntity}
            names={names}
          />
          <DisplayNameControl displayName={clonedEntity.displayName} onChange={onChangeDisplayName} required={true} />

          {view === ApplicationRoute.Models && (
            <VersionControl
              version={(clonedEntity as DialModel).displayVersion}
              onChange={onChangeVersion}
              optional={true}
            />
          )}
        </div>
      </div>
    </DialFormPopup>
  );
};
export default DuplicateEntity;
