'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { ALIAS_NAME_PATTERN } from '@/src/constants/aliases';
import { AliasI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { applyAliasTargetChange } from '@/src/utils/aliases/default-headers';
import { AliasCreateStep } from './constants';
import TargetField, { AliasTargetChange } from './TargetField';

interface Props {
  step: AliasCreateStep;
  entity: DialAliasResource;
  /** The aliases already in the bucket the new one is written to. */
  names: string[];
  /** The alias is written to the Public bucket. */
  isPublic?: boolean;
  isUniqueNameError?: boolean;
  externalError?: string;
  onChangeEntity: (entity: object) => void;
}

/**
 * Body of the create wizard for a new alias. The first step holds how it is named and listed, the second what it
 * forwards to; roles are edited on the details view. The name is the only thing Core fixes at creation, and the
 * alias is called by it, so it is limited to the characters a URL carries unchanged.
 */
const AliasCreateProperties: FC<Props> = ({
  step,
  entity,
  names,
  isPublic,
  isUniqueNameError,
  externalError,
  onChangeEntity,
}) => {
  const t = useI18n();
  const nameError = entity.name && !ALIAS_NAME_PATTERN.test(entity.name) ? t(AliasI18nKey.NameInvalid) : undefined;

  const onChangeTarget = useCallback(
    (change: AliasTargetChange) => onChangeEntity(applyAliasTargetChange(entity, change)),
    [entity, onChangeEntity],
  );

  if (step === AliasCreateStep.Target) {
    return (
      <TargetField
        isModal
        isPublic={isPublic}
        target={entity.target}
        presentAs={entity.presentAs}
        onChange={onChangeTarget}
      />
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      <IdControl
        label={t(EntityFieldsI18nKey.id)}
        placeholder={t(EntityPlaceholdersI18nKey.Id)}
        entity={entity}
        names={names}
        isUniqueNameError={isUniqueNameError}
        externalError={nameError ?? externalError}
        onChangeEntity={onChangeEntity}
      />
      <DisplayNameControl
        required
        displayName={entity.displayName}
        onChange={(displayName) => onChangeEntity({ ...entity, displayName })}
      />
      <Input
        id="alias-display-version"
        labelProps={{ label: t(AliasI18nKey.DisplayVersion) }}
        placeholder={t(EntityPlaceholdersI18nKey.DisplayVersion)}
        value={entity.displayVersion ?? ''}
        onChange={(displayVersion) => onChangeEntity({ ...entity, displayVersion: displayVersion || undefined })}
      />
      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />
    </div>
  );
};

export default AliasCreateProperties;
