'use client';

import { FC, useCallback, useId, useMemo, useState } from 'react';

import { Button, ButtonVariant, Input, RadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import SubjectKindIcon from '@/src/components/FoldersStorage/SubjectKindIcon';
import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OrgUnitSubject, SubjectKind } from '@/src/models/dial/org-unit';
import {
  buildSubject,
  isValidClaimKey,
  isValidEmail,
  isValidHolderValue,
  RESERVED_CLAIM_KEYS,
} from '@/src/utils/org-units/subjects';

interface Props {
  roleName: string;
  onAdd: (roleName: string, subject: OrgUnitSubject) => void;
}

const ADDABLE_KINDS = [SubjectKind.PERSON, SubjectKind.DIAL_ROLE, SubjectKind.CLAIM, SubjectKind.EVERYONE];

const PLACEHOLDER_KEYS: Partial<Record<SubjectKind, FoldersI18nKey>> = {
  [SubjectKind.PERSON]: FoldersI18nKey.HolderPersonPlaceholder,
  [SubjectKind.DIAL_ROLE]: FoldersI18nKey.HolderRolePlaceholder,
  [SubjectKind.CLAIM]: FoldersI18nKey.HolderClaimValue,
};

const AddHolderForm: FC<Props> = ({ roleName, onAdd }) => {
  const t = useI18n();
  const id = useId();
  const [kind, setKind] = useState(SubjectKind.PERSON);
  const [value, setValue] = useState('');
  const [claimKey, setClaimKey] = useState('');

  const isEveryone = kind === SubjectKind.EVERYONE;
  const isTouched = value.length > 0;
  const isEmail = kind === SubjectKind.PERSON;
  const isClaim = kind === SubjectKind.CLAIM;
  const isValueValid = isEmail ? isValidEmail(value) : isValidHolderValue(value);
  const isKeyTouched = claimKey.length > 0;
  const isKeyValid = isValidClaimKey(claimKey);
  const isValid = isEveryone || (isValueValid && (!isClaim || isKeyValid));
  const errorKey = isEmail ? FoldersI18nKey.HolderEmailInvalid : FoldersI18nKey.HolderInvalid;
  const keyErrorKey = RESERVED_CLAIM_KEYS.includes(claimKey.trim())
    ? FoldersI18nKey.HolderClaimKeyReserved
    : FoldersI18nKey.HolderInvalid;

  const items = useMemo(() => {
    const labels: Partial<Record<SubjectKind, string>> = {
      [SubjectKind.PERSON]: t(FoldersI18nKey.HolderPerson),
      [SubjectKind.DIAL_ROLE]: t(FoldersI18nKey.HolderRole),
      [SubjectKind.CLAIM]: t(FoldersI18nKey.HolderClaim),
      [SubjectKind.EVERYONE]: t(FoldersI18nKey.HolderEveryone),
    };
    return ADDABLE_KINDS.map((item) => ({
      value: item,
      label: (
        <span className="inline-flex items-center gap-1">
          <SubjectKindIcon kind={item} />
          {labels[item]}
        </span>
      ),
      'aria-label': labels[item],
    }));
  }, [t]);

  const onSubmit = useCallback(() => {
    onAdd(roleName, buildSubject(kind, value, claimKey));
    setValue('');
    setClaimKey('');
  }, [onAdd, roleName, kind, value, claimKey]);

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        id={`${id}-kind`}
        ariaLabel={t(FoldersI18nKey.HolderKind)}
        orientation={RadioGroupOrientation.Row}
        items={items}
        value={kind}
        onChange={(next) => setKind(next as SubjectKind)}
      />
      <div className="flex flex-row items-start gap-3">
        {isClaim && (
          <Input
            id={`${id}-key`}
            containerClassName="flex-1 min-w-0"
            aria-label={t(FoldersI18nKey.HolderClaimKey)}
            name={`${id}-claim-key`}
            autoComplete="one-time-code"
            placeholder={t(FoldersI18nKey.HolderClaimKey)}
            value={claimKey}
            invalid={isKeyTouched && !isKeyValid}
            error={isKeyTouched && !isKeyValid ? t(keyErrorKey) : undefined}
            onChange={(next) => setClaimKey(next ?? '')}
          />
        )}
        {!isEveryone && (
          <Input
            id={`${id}-value`}
            containerClassName="flex-1 min-w-0"
            aria-label={t(isClaim ? FoldersI18nKey.HolderClaimValue : FoldersI18nKey.AddHolder)}
            name={`${id}-holder`}
            autoComplete="one-time-code"
            placeholder={PLACEHOLDER_KEYS[kind] ? t(PLACEHOLDER_KEYS[kind]) : undefined}
            value={value}
            invalid={isTouched && !isValid}
            error={isTouched && !isValid ? t(errorKey) : undefined}
            onChange={(next) => setValue(next ?? '')}
          />
        )}
        <Button
          variant={ButtonVariant.Neutral}
          label={t(ButtonsI18nKey.Add)}
          disabled={!isValid || (!isEveryone && !isTouched)}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
};

export default AddHolderForm;
