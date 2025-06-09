'use client';

import { FC, useEffect, useState } from 'react';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';

interface Props {
  isChanged: boolean;
  isSaveDisable: boolean;
  title: string;
  save: () => void;
  discard: () => void;
}

const FolderInfoHeader: FC<Props> = ({ isChanged, isSaveDisable, title, save, discard }) => {
  const t = useI18n();
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [buttonsClassNames, setButtonsClassNames] = useState('');

  useEffect(() => {
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
  }, [isTablet, isMobile]);

  return (
    <div className="flex justify-between items-center">
      <h2>{title}</h2>
      {isChanged && (
        <div className="flex flex-row gap-3 p-3 lg:p-0">
          <Button cssClass={`secondary ${buttonsClassNames}`} title={t(ButtonsI18nKey.Discard)} onClick={discard} />
          <Button
            cssClass={`primary ${buttonsClassNames}`}
            title={t(ButtonsI18nKey.Save)}
            onClick={save}
            disable={isSaveDisable}
          />
        </div>
      )}
    </div>
  );
};

export default FolderInfoHeader;
