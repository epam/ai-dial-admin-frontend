'use client';

import { FC, useCallback, useEffect } from 'react';

import { Input, Label } from '@epam/ai-dial-ui-kit';
import IdControl from '@/src/components/BaseControls/Id/Id';
import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, PluginI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { getControlClassName } from '@/src/utils/entities/view';
import { PluginCreateEntity } from './models';

interface Props {
  entity: PluginCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
  /** True in the create popup (full-width inputs, `id` field shown); false on the details view
   * (`id` hidden, inputs at `STANDARD_CONTROL_WIDTH`) — see `getControlClassName`. */
  isModal?: boolean;
}

/**
 * Shared field set for a plugin asset — the create-modal body **and** the details-view Properties tab
 * (`Properties.tsx` renders this with `isModal={false}`): the plain Core entity-name field (create only,
 * `id` is immutable afterwards), the required `type`, and the free-form `settings` object. `Plugin` is a
 * plain POJO on Core, so there is no display name, description or roles control, and any other field
 * fails the write.
 */
const PluginCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const controlClassName = getControlClassName(isModal);
  const isTypeInvalid = !entity.type?.trim();

  const onChangeType = useCallback(
    (type = '') => {
      onChangeEntity({ ...entity, type });
      dispatch({ type: ValidationActionType.SetField, field: 'type', isValid: !!type.trim() });
    },
    [entity, onChangeEntity, dispatch],
  );

  const onChangeSettings = useCallback(
    (settings: object) => onChangeEntity({ ...entity, settings }),
    [entity, onChangeEntity],
  );

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'type', isValid: !isTypeInvalid });

    return () => dispatch({ type: ValidationActionType.SetField, field: 'type', isValid: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      {isModal && (
        <IdControl
          label={t(EntityFieldsI18nKey.id)}
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          entity={entity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          onChangeEntity={onChangeEntity}
          isFullWidth={isModal}
        />
      )}
      <Input
        id="plugin-type"
        labelProps={{ label: t(PluginI18nKey.Type), required: true }}
        placeholder={t(PluginI18nKey.TypePlaceholder)}
        value={entity.type ?? ''}
        error={isTypeInvalid && entity.type != null ? t(PluginI18nKey.TypeRequired) : undefined}
        invalid={isTypeInvalid && entity.type != null}
        containerClassName={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={onChangeType}
      />
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <Label label={t(PluginI18nKey.Settings)} />
          <FieldCaveat hint={t(PluginI18nKey.SettingsHint)} />
        </div>
        <JsonEditorInput
          value={entity.settings ?? {}}
          wrapperClassName={controlClassName}
          onChangeValue={onChangeSettings}
        />
      </div>
    </div>
  );
};

export default PluginCreateProperties;
