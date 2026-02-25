import { FC, useCallback, useEffect, useState } from 'react';
import { DialFormPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  isModalOpen: boolean;
  names: string[];
  adapter: DialAdapter;
  onClose: () => void;
  onDuplicate: (entity: DialAdapter) => void;
}

const DuplicateAdapter: FC<Props> = ({ names, onDuplicate, isModalOpen, onClose, adapter }) => {
  const t = useI18n();

  const [entity, setEntity] = useState<DialAdapter>({ ...adapter, name: getClonedEntityName(adapter.name) });
  const { isValid, dispatch } = useSaveValidationContext();

  // initial validation on creation adapter (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!entity.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!entity.displayName });
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !!entity.baseEndpoint });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setEntity({ ...entity, displayName });
    },
    [setEntity, entity],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint?: string) => {
      setEntity({ ...entity, baseEndpoint });
    },
    [setEntity, entity],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.Adapters, t))}
      portalId="DuplicateAdapter"
      open={isModalOpen}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
      onSubmit={() => onDuplicate(entity)}
      onCancel={onClose}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col gap-y-8 px-6 py-4">
        <IdControl entity={entity} onChangeEntity={setEntity} names={names} />

        <DisplayNameControl displayName={entity.displayName} onChange={onChangeDisplayName} required={true} />

        <EndpointControl
          id="baseEndpoint"
          required={true}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          label={t(EntityFieldsI18nKey.baseEndpoint)}
          endpoint={entity.baseEndpoint}
          onChange={onChangeEndpoint}
        />
      </div>
    </DialFormPopup>
  );
};

export default DuplicateAdapter;
