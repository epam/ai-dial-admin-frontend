'use client';

import { Label, Select } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import SelectEntitiesPopup from '@/src/components/Common/EntitySelectInput/SelectEntitiesPopup';
import { EntitySelectType, PickedEntity } from '@/src/components/Common/EntitySelectInput/models';
import { ALIAS_PLATFORM_ONLY_TARGET_TYPES } from '@/src/constants/aliases';
import { AliasI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AliasPresentAs, AliasTarget, AliasTargetType } from '@/src/models/dial/alias';
import { getAliasDefaultPresentAs, getAliasPresentAsOptions, toStoredPresentAs } from '@/src/utils/aliases/present-as';
import { parseAliasTargetPath, toAliasTargetPath } from '@/src/utils/aliases/target';
import { getControlClassName } from '@/src/utils/entities/view';

export interface AliasTargetChange {
  target?: AliasTarget;
  presentAs?: AliasPresentAs;
}

interface Props {
  target?: AliasTarget;
  presentAs?: AliasPresentAs;
  /** True in the create popup (full-width controls); false on the details view. */
  isModal?: boolean;
  /** A Public alias: Core refuses a router target there, so that type is not offered. */
  isPublic?: boolean;
  isReadOnly?: boolean;
  onChange: (change: AliasTargetChange) => void;
}

const ENTITY_SELECT_TYPE: Record<AliasTargetType, EntitySelectType> = {
  [AliasTargetType.Model]: EntitySelectType.Model,
  [AliasTargetType.Application]: EntitySelectType.Application,
  [AliasTargetType.Toolset]: EntitySelectType.Toolset,
  [AliasTargetType.Router]: EntitySelectType.Router,
};

const TARGET_TYPE_LABEL: Record<AliasTargetType, AliasI18nKey> = {
  [AliasTargetType.Model]: AliasI18nKey.TargetTypeModel,
  [AliasTargetType.Application]: AliasI18nKey.TargetTypeApplication,
  [AliasTargetType.Toolset]: AliasI18nKey.TargetTypeToolset,
  [AliasTargetType.Router]: AliasI18nKey.TargetTypeRouter,
};

const PICKER_HEADER: Record<AliasTargetType, AliasI18nKey> = {
  [AliasTargetType.Model]: AliasI18nKey.SelectModelTarget,
  [AliasTargetType.Application]: AliasI18nKey.SelectApplicationTarget,
  [AliasTargetType.Toolset]: AliasI18nKey.SelectToolsetTarget,
  [AliasTargetType.Router]: AliasI18nKey.SelectRouterTarget,
};

const PRESENT_AS_LABEL: Record<AliasPresentAs, AliasI18nKey> = {
  [AliasPresentAs.Model]: AliasI18nKey.PresentAsModel,
  [AliasPresentAs.Application]: AliasI18nKey.PresentAsApplication,
  [AliasPresentAs.Toolset]: AliasI18nKey.PresentAsToolset,
  [AliasPresentAs.Router]: AliasI18nKey.PresentAsRouter,
};

/**
 * What an alias forwards to: the type of the target, the target itself (picked from every source that type has)
 * and the type the alias is presented as. The `presentAs` options follow the target type, so a combination Core
 * would refuse cannot be built; a Public alias is not offered the router type, which only a Platform alias may
 * target. A type already stored stays listed, so a loaded alias still shows what it holds. A stored `target.path` this form cannot read is shown as text and left alone
 * until the user picks a new target.
 */
const TargetField: FC<Props> = ({ target, presentAs, isModal, isPublic, isReadOnly, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const controlClassName = getControlClassName(isModal);
  const parsed = useMemo(() => parseAliasTargetPath(target?.path), [target?.path]);
  const [targetType, setTargetType] = useState<AliasTargetType>(parsed?.type ?? AliasTargetType.Application);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const hasUnparsableTarget = !!target?.path && !parsed;
  const displayPath = parsed ? `${parsed.type}/${parsed.reference}` : (target?.path ?? '');

  const typeOptions = useMemo(
    () =>
      Object.values(AliasTargetType)
        .filter((type) => !isPublic || type === targetType || !ALIAS_PLATFORM_ONLY_TARGET_TYPES.includes(type))
        .map((type) => ({ value: type, label: t(TARGET_TYPE_LABEL[type]) })),
    [isPublic, targetType, t],
  );
  const presentAsOptions = useMemo(
    () => getAliasPresentAsOptions(targetType).map((value) => ({ value, label: t(PRESENT_AS_LABEL[value]) })),
    [targetType, t],
  );

  const onChangeType = useCallback(
    (value: string | string[]) => {
      const nextType = value as AliasTargetType;
      setTargetType(nextType);
      // A target of the old type is no longer one; the choice of `presentAs` survives only where it still fits.
      onChange({ target: undefined, presentAs: toStoredPresentAs(nextType, presentAs) });
    },
    [onChange, presentAs],
  );

  const onChangePresentAs = useCallback(
    (value: string | string[]) => {
      onChange({ target, presentAs: toStoredPresentAs(targetType, value as AliasPresentAs) });
    },
    [onChange, target, targetType],
  );

  const onApplyTarget = useCallback(
    (entities: PickedEntity[]) => {
      setIsPickerOpen(false);
      const [entity] = entities;
      if (entity) {
        onChange({ target: { path: toAliasTargetPath(targetType, entity) }, presentAs });
      }
    },
    [onChange, presentAs, targetType],
  );

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'target', isValid: !!target?.path });
  }, [dispatch, target?.path]);

  useEffect(
    () => () => {
      dispatch({ type: ValidationActionType.SetField, field: 'target', isValid: true });
    },
    [dispatch],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <Select
        id="alias-target-type"
        labelProps={{ label: t(AliasI18nKey.TargetType), required: true }}
        options={typeOptions}
        value={targetType}
        className={controlClassName}
        disabled={isReadOnly}
        onChange={onChangeType}
      />
      <div className={`flex flex-col gap-y-2 ${controlClassName}`}>
        <Label label={t(AliasI18nKey.Target)} required htmlFor="alias-target" />
        <InputPopup
          elementId="alias-target"
          placeholder={t(AliasI18nKey.TargetPlaceholder)}
          selectedValue={displayPath}
          disabled={isReadOnly}
          open={isPickerOpen}
          onOpen={() => setIsPickerOpen(true)}
        >
          <SelectEntitiesPopup
            isSingle
            isOpen={isPickerOpen}
            entityType={ENTITY_SELECT_TYPE[targetType]}
            header={t(PICKER_HEADER[targetType])}
            onClose={() => setIsPickerOpen(false)}
            onApply={onApplyTarget}
          />
        </InputPopup>
        {hasUnparsableTarget && (
          <p className="dial-tiny-text text-secondary">
            {t(AliasI18nKey.UnparsableTarget, { path: target?.path ?? '' })}
          </p>
        )}
      </div>
      <Select
        id="alias-present-as"
        labelProps={{ label: t(AliasI18nKey.PresentAs) }}
        options={presentAsOptions}
        value={presentAs ?? getAliasDefaultPresentAs(targetType)}
        className={controlClassName}
        disabled={isReadOnly}
        onChange={onChangePresentAs}
      />
      <p className="dial-tiny-text text-secondary -mt-6">{t(AliasI18nKey.PresentAsDescription)}</p>
    </div>
  );
};

export default TargetField;
