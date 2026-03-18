'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ValidityPeriods } from '@/src/types/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { calculateExpirationDate } from '@/src/utils/keys';

export interface Props {
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const ValidityPeriod: FC<Props> = ({ onChange, disabled }) => {
  const t = useI18n();

  const items: SelectOption[] = useMemo(() => {
    return [
      { value: ValidityPeriods.DAY, label: t(KeysI18nKey.PeriodDay) },
      { value: ValidityPeriods.WEEK, label: t(KeysI18nKey.PeriodWeek) },
      { value: ValidityPeriods.MONTH, label: t(KeysI18nKey.PeriodMonth) },
      { value: ValidityPeriods.THREE_MONTHS, label: `3 ${t(KeysI18nKey.PeriodMonths)}` },
      { value: ValidityPeriods.SIX_MONTHS, label: `6 ${t(KeysI18nKey.PeriodMonths)}` },
      { value: ValidityPeriods.YEAR, label: t(KeysI18nKey.PeriodYear) },
    ];
  }, [t]);

  const [selectedValue, setSelectedValue] = useState('');
  const [expirationTime, setExpirationTime] = useState<string>();

  const onChangeValue = useCallback(
    (value: string) => {
      const expiration = calculateExpirationDate(value);
      setExpirationTime(expiration);
      setSelectedValue(value);

      onChange?.(expiration);
    },
    [onChange],
  );

  useEffect(() => {
    const defaultValue = items[3].value;
    onChangeValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-row gap-8">
      <DialSelectField
        label={t(KeysI18nKey.ValidityPeriod)}
        value={selectedValue}
        options={items}
        id="period"
        onChange={(value) => onChangeValue(value as string)}
        containerClassName="w-[180px]"
        disabled={disabled}
      />
      <LabelledText
        label={t(EntityFieldsI18nKey.expiresAt)}
        text={formatDateTimeToLocalString(expirationTime) || ''}
        className="justify-center"
      />
    </div>
  );
};

export default ValidityPeriod;
