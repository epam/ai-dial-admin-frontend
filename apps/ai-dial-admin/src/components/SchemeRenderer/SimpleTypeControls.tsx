'use client';

import { FC } from 'react';
import { DialNumberInput, DialSelectField, DialInput } from '@epam/ai-dial-ui-kit';

import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SchemeParameterControl } from './models';
import { SchemeParameterType } from './types';

interface Props {
  control: SchemeParameterControl;
}

const SimpleTypeControls: FC<Props> = ({ control }) => {
  const t = useI18n();

  return (
    <>
      {control.type === SchemeParameterType.string && (
        <div className="w-[35%]">
          <DialInput
            id={control.id}
            labelProps={{ title: control.label }}
            required={!control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            disabled={true}
          />
        </div>
      )}
      {control.type === SchemeParameterType.number && (
        <div className="w-[120px]">
          <DialNumberInput
            id={control.id}
            labelProps={{ title: control.label }}
            required={!control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            disabled={true}
          />
        </div>
      )}
      {control.type === SchemeParameterType.boolean && (
        <div className="w-[35%]">
          <DialSelectField
            id={control.id}
            label={control.label}
            required={!control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Select)}
            disabled={true}
            options={[]}
            onChange={() => void 0}
          />
        </div>
      )}
    </>
  );
};

export default SimpleTypeControls;
