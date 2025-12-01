import { FC } from 'react';

import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  description?: boolean;
  added?: number;
  removed?: number;
  changed?: number;
}

const DiffLegend: FC<Props> = ({ description, added, removed, changed }) => {
  const t = useI18n();

  const containerClassName = classNames(
    'flex flex-row small',
    description ? 'gap-8 text-secondary' : 'gap-2 text-primary',
  );
  const itemClassName = classNames('flex items-center gap-1');
  const descriptionClassName = classNames(description ? '' : 'hidden');
  const rectangleClassName = classNames(
    'inline-block rounded-sm border',
    description ? 'w-[14px] h-[14px]' : 'w-[24px] h-[24px] flex items-center justify-center',
  );

  return (
    <div className={containerClassName}>
      <div className={`${itemClassName} ${(description ? false : !added) && 'hidden'}`}>
        <span className={`${rectangleClassName}  bg-success border-accent-secondary`}>{added}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Create)}</span>
      </div>
      <div className={`${itemClassName} ${(description ? false : !changed) && 'hidden'}`}>
        <span className={`${rectangleClassName}  bg-info border-accent-primary`}>{changed}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Update)}</span>
      </div>
      <div className={`${itemClassName} ${(description ? false : !removed) && 'hidden'}`}>
        <span className={`${rectangleClassName}  bg-error border-error`}>{removed}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Delete)}</span>
      </div>
    </div>
  );
};

export default DiffLegend;
