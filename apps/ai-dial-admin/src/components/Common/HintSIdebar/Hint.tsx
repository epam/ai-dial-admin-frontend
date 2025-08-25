import { FC } from 'react';
import { IconX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';

import Button from '@/src/components/Common/Button/Button';

interface Props {
  title: string;
  text: string;
}

const Hint: FC<Props> = ({ title, text }) => {
  const t = useI18n();
  const { closeHintSidebar } = useAppContext().hintSidebar;

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-primary overflow-ellipsis">{title}</h3>
        <Button
          aria-label={t(ButtonsI18nKey.Close)}
          cssClass="text-secondary hover:text-accent-primary"
          onClick={closeHintSidebar}
          iconBefore={<IconX height={24} width={24} />}
        ></Button>
      </div>
      <div className="overflow-y-scroll">
        <p className="small text-primary">{text}</p>
      </div>
    </div>
  );
};

export default Hint;
