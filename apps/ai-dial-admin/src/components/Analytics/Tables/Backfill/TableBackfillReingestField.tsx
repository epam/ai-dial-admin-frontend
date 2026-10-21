'use client';

import { FC } from 'react';

import { Checkbox } from '@epam/ai-dial-ui-kit';

import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  caption: string;
  isSelected: boolean;
  isDisabled: boolean;
  onChange: (isSelected: boolean) => void;
}

const TableBackfillReingestField: FC<Props> = ({ caption, isSelected, isDisabled, onChange }) => {
  const t = useI18n();

  return (
    <Checkbox
      labelProps={{ label: t(BackfillI18nKey.Reingest) }}
      caption={caption}
      isSelected={isSelected}
      disabled={isDisabled}
      onChange={onChange}
    />
  );
};

export default TableBackfillReingestField;
