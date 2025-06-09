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

const ActivityAuditEntityDiffLegend: FC<Props> = ({ description, added, removed, changed }) => {
  const t = useI18n();

  const containerClass = classNames('flex flex-row small', description ? 'gap-6 text-secondary' : 'gap-2 text-primary');
  const itemClass = classNames('flex items-center gap-1');
  const descriptionClass = classNames(description ? '' : 'hidden');
  const rectangleClass = classNames(
    'inline-block rounded-sm border',
    description ? 'w-[14px] h-[14px]' : 'w-[24px] h-[24px] flex items-center justify-center',
  );

  return (
    <div className={containerClass}>
      <div className={`${itemClass} ${(description ? false : !added) && 'hidden'}`}>
        <span className={`${rectangleClass}  bg-success border-accent-secondary`}>{added}</span>
        <span className={descriptionClass}>{t(ButtonsI18nKey.Create)}</span>
      </div>
      <div className={`${itemClass} ${(description ? false : !changed) && 'hidden'}`}>
        <span className={`${rectangleClass}  bg-info border-accent-primary`}>{changed}</span>
        <span className={descriptionClass}>{t(ButtonsI18nKey.Update)}</span>
      </div>
      <div className={`${itemClass} ${(description ? false : !removed) && 'hidden'}`}>
        <span className={`${rectangleClass}  bg-error border-error`}>{removed}</span>
        <span className={descriptionClass}>{t(ButtonsI18nKey.Delete)}</span>
      </div>
    </div>
  );
};

export default ActivityAuditEntityDiffLegend;
