import { FC } from 'react';

import classNames from 'classnames';

import {
  AUDIT_DIFF_DELETE_HIGHLIGHT_CLASS,
  AUDIT_DIFF_INSERT_HIGHLIGHT_CLASS,
} from '@/src/components/ActivityAudit/constants';
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

  const itemClassName = 'flex items-center gap-1';
  const descriptionClassName = classNames(!description && 'hidden');
  const rectangleClassName = classNames(
    'inline-block rounded-sm border',
    description ? 'w-[14px] h-[14px]' : 'w-[24px] h-[24px] flex items-center justify-center',
  );

  return (
    <div className={classNames('flex flex-row small', description ? 'gap-8 text-secondary' : 'gap-2 text-primary')}>
      <div className={classNames(itemClassName, !description && !added && 'hidden')}>
        <span className={classNames(rectangleClassName, AUDIT_DIFF_INSERT_HIGHLIGHT_CLASS)}>{added}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Create)}</span>
      </div>
      <div className={classNames(itemClassName, !description && !changed && 'hidden')}>
        <span className={classNames(rectangleClassName, 'bg-info border-accent-primary')}>{changed}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Update)}</span>
      </div>
      <div className={classNames(itemClassName, !description && !removed && 'hidden')}>
        <span className={classNames(rectangleClassName, AUDIT_DIFF_DELETE_HIGHLIGHT_CLASS)}>{removed}</span>
        <span className={descriptionClassName}>{t(ButtonsI18nKey.Delete)}</span>
      </div>
    </div>
  );
};

export default DiffLegend;
