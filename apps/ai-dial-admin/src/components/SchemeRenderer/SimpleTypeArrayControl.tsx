'use client';

import { FC } from 'react';

import { IconPlus } from '@tabler/icons-react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { simpleControlTypes } from './constants';
import { SchemeParameterControl } from './models';
import SimpleTypeControls from './SimpleTypeControls';

interface Props {
  control: SchemeParameterControl;
  type: string;
}

const SimpleTypeArrayControl: FC<Props> = ({ control, type }) => {
  const t = useI18n();

  return (
    <div key={control.id} className="flex flex-col gap-2">
      {simpleControlTypes.includes(type) && <SimpleTypeControls key={control.id} control={{ ...control, type }} />}
      {!simpleControlTypes.includes(type) && <div>{control.id}</div>}
      <div>
        <DialButton
          disable={true}
          variant={ButtonVariant.Tertiary}
          title={t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        />
      </div>
    </div>
  );
};

export default SimpleTypeArrayControl;
