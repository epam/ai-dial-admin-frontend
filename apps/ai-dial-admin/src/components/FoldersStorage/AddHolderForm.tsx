'use client';

import { FC, useCallback, useId, useMemo, useState } from 'react';

import { Button, ButtonVariant, Input, RadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OrgUnitSubject, SubjectKind } from '@/src/models/dial/org-unit';
import { buildSubject, isValidHolderValue } from '@/src/utils/org-units/subjects';

interface Props {
  roleName: string;
  groupClaim: string;
  onAdd: (roleName: string, subject: OrgUnitSubject) => void;
}

const ADDABLE_KINDS = [SubjectKind.PERSON, SubjectKind.GROUP, SubjectKind.EVERYONE];

const AddHolderForm: FC<Props> = ({ roleName, groupClaim, onAdd }) => {
  const t = useI18n();
  const id = useId();
  const [kind, setKind] = useState(SubjectKind.PERSON);
  const [value, setValue] = useState('');

  const isEveryone = kind === SubjectKind.EVERYONE;
  const isTouched = value.length > 0;
  const isValid = isEveryone || isValidHolderValue(value);

  const items = useMemo(() => {
    const labels: Partial<Record<SubjectKind, string>> = {
      [SubjectKind.PERSON]: t(FoldersI18nKey.HolderPerson),
      [SubjectKind.GROUP]: t(FoldersI18nKey.HolderGroup),
      [SubjectKind.EVERYONE]: t(FoldersI18nKey.HolderEveryone),
    };
    return ADDABLE_KINDS.map((item) => ({ value: item, label: labels[item] }));
  }, [t]);

  const onSubmit = useCallback(() => {
    onAdd(roleName, buildSubject(kind, value, groupClaim));
    setValue('');
  }, [onAdd, roleName, kind, value, groupClaim]);

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
        {!isEveryone && (
          <Input
            id={`${id}-value`}
            containerClassName="flex-1 min-w-0"
            aria-label={t(FoldersI18nKey.AddHolder)}
            placeholder={
              kind === SubjectKind.PERSON
                ? t(FoldersI18nKey.HolderPersonPlaceholder)
                : t(FoldersI18nKey.HolderGroupPlaceholder)
            }
            value={value}
            invalid={isTouched && !isValid}
            error={isTouched && !isValid ? t(FoldersI18nKey.HolderInvalid) : undefined}
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
