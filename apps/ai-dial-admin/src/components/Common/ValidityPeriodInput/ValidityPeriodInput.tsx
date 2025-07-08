'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import Field from '@/src/components/Common/Field/Field';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { CreateI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ValidityPeriods } from '@/src/types/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { calculateExpirationDate } from '@/src/utils/keys';

export interface Props {
  onChange?: (value: number) => void;
}

const ValidityPeriodInput: FC<Props> = ({ onChange }) => {
  const t = useI18n();
  const items: DropdownItemsModel[] = useMemo(() => {
    return [
      { id: ValidityPeriods.DAY, name: t(KeysI18nKey.PeriodDay) },
      { id: ValidityPeriods.WEEK, name: t(KeysI18nKey.PeriodWeek) },
      { id: ValidityPeriods.MONTH, name: t(KeysI18nKey.PeriodMonth) },
      { id: ValidityPeriods.THREE_MONTHS, name: `3 ${t(KeysI18nKey.PeriodMonths)}` },
      { id: ValidityPeriods.SIX_MONTHS, name: `6 ${t(KeysI18nKey.PeriodMonths)}` },
      { id: ValidityPeriods.YEAR, name: t(KeysI18nKey.PeriodYear) },
    ];
  }, [t]);

  const [selectedValue, setSelectedValue] = useState('');
  const [expirationTime, setExpirationTime] = useState<number>();

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
    const defaultValue = items[3].id;
    onChangeValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-row gap-6">
      <div className="flex flex-col">
        <Field fieldTitle={t(CreateI18nKey.ValidityPeriodTitle)} />
        <div className="w-[160px]">
          <Dropdown
            className="w-full flex items-center"
            selectedValue={items.find((item) => item.id === selectedValue)}
          >
            {items.map((item) => (
              <DropdownMenuItem
                key={item.name}
                dropdownItem={item}
                isActiveItem={selectedValue === item.id}
                onClick={() => onChangeValue(item.id)}
              />
            ))}
          </Dropdown>
        </div>
      </div>
      <LabeledText label={t(KeysI18nKey.ExpirationTime)}>
        <div className="flex flex-1 items-center">
          {expirationTime ? formatDateTimeToLocalString(expirationTime) : ''}
        </div>
      </LabeledText>
    </div>
  );
};

export default ValidityPeriodInput;
