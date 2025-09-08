'use client';

import { FC } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationSchemeControl } from './models';
import { ControlType } from './types';

interface Props {
  control: DialApplicationSchemeControl;
}

const SimpleTypeControls: FC<Props> = ({ control }) => {
  const t = useI18n();

  return (
    <>
      {control.type === ControlType.string && (
        <div className="w-[35%]">
          <TextInputField
            elementId={control.id}
            fieldTitle={control.label}
            optional={control.optional}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            disabled={true}
          />
        </div>
      )}
      {control.type === ControlType.number && (
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
      {control.type === ControlType.boolean && (
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
