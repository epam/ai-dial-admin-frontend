import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { duplicateModalDescriptionMap, getTitle } from './utils';

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
    isSimple ? { ...entity, name: void 0 } : { ...entity, name: void 0, displayVersion: void 0, displayName: void 0 },
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialPopup
      onClose={onClose}
      title={t(getTitle(view, t))}
      portalId="CloneEntity"
      open={isModalOpen}
      footer={
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Duplicate)}
            disable={!isValid}
            onClick={() => onDuplicate(clonedEntity)}
          />
        </div>
      }
    >
      <div className="flex flex-col px-6 py-4">
        {!!duplicateModalDescriptionMap[view] && (
          <div className="text-secondary small mb-4">{t(duplicateModalDescriptionMap[view])}</div>
        )}
        <div className="flex flex-col gap-6">
          <IdControl entity={clonedEntity} onChangeEntity={setEntity} names={names} />
          <DisplayNameControl displayName={clonedEntity.displayName} onChange={onChangeDisplayName} />

          {view === ApplicationRoute.Models && (
            <VersionControl
              version={(clonedEntity as DialModel).displayVersion}
              onChange={onChangeVersion}
              optional={true}
            />
          )}
        </div>
      </div>
    </DialPopup>
  );
};
export default DuplicateEntity;
