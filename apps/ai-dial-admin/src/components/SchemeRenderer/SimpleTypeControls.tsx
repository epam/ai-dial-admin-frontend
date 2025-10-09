'use client';

import { FC } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
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
          <DialTextInputField
            elementId={control.id}
            fieldTitle={control.label}
            optional={control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            disabled={true}
          />
        </div>
      )}
      {control.type === SchemeParameterType.number && (
        <div className="w-[120px]">
          <NumberInputField
            elementId={control.id}
            fieldTitle={control.label}
            optional={control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            disabled={true}
          />
        </div>
      )}
      {control.type === SchemeParameterType.boolean && (
        <div className="w-[35%]">
          <DropdownField
            elementId={control.id}
            fieldTitle={control.label}
            optional={control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Select)}
            disabled={true}
            items={[]}
            onChange={() => void 0}
          />
        </div>
      )}
    </>
  );
};

export default SimpleTypeControls;
