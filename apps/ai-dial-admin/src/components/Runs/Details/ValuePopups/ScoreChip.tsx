'use client';

import { FC } from 'react';

import classNames from 'classnames';

import {
  ERROR_SCORE_CHIP_CLASSES,
  NEUTRAL_SCORE_CHIP_CLASSES,
  SCORE_CHIP_BUCKET_CLASSES,
} from '@/src/components/Runs/Details/ValuePopups/constants';
import { getScoreChipClasses } from '@/src/components/Runs/Details/ValuePopups/utils';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  raw: string | null;
  isFailed: boolean;
}

const MISSING_DISPLAY = '—';

const ScoreChip: FC<Props> = ({ raw, isFailed }) => {
  const t = useI18n();
  const bucketClasses = isFailed ? null : getScoreChipClasses(raw);
  const text = isFailed ? t(ErrorI18nKey.Error) : (raw ?? MISSING_DISPLAY);

  const getClasses = () => {
    if (isFailed) return ERROR_SCORE_CHIP_CLASSES;
    if (bucketClasses) return [SCORE_CHIP_BUCKET_CLASSES, bucketClasses.background, bucketClasses.text];
    return NEUTRAL_SCORE_CHIP_CLASSES;
  };

  return (
    <span className={classNames('inline-flex w-fit items-center dial-small-semi-text', getClasses())}>{text}</span>
  );
};

export default ScoreChip;
