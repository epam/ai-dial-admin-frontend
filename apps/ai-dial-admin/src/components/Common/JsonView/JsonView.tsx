'use client';

import { FC } from 'react';

import classNames from 'classnames';

import DiffField from '@/src/components/Common/DiffField/DiffField';
import { CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  modified: string;
  original: string;
  containerClassName?: string;
  leftTitle?: string;
  rightTitle?: string;
}

const JsonView: FC<Props> = ({ modified, original, containerClassName, leftTitle, rightTitle }) => {
  const t = useI18n();

  return (
    <div className={classNames('flex-1 flex flex-col min-h-0', containerClassName)}>
      <div className="flex flex-row">
        <h4 className="mb-2 text-secondary w-[50%]">{leftTitle || t(CompareI18nKey.Before)}</h4>
        <h4 className="mb-2 text-secondary">{rightTitle || t(CompareI18nKey.After)}</h4>
      </div>
      <DiffField label="" modified={modified} original={original} className="overflow-hidden" language="json" />
    </div>
  );
};

export default JsonView;
