import { FC, useMemo } from 'react';

import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { BooleanI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BooleanType } from '@/src/types/boolean';

export const CheckboxWidget: FC<WidgetProps> = ({ value, onChange }) => {
  const t = useI18n();
  const booleans: SelectOption[] = useMemo(
    () => [
      {
        value: BooleanType.true,
        label: t(BooleanI18nKey.true),
      },
      {
        value: BooleanType.false,
        label: t(BooleanI18nKey.false),
      },
    ],
    [t],
  );

  const boolValue = useMemo(() => {
    if (value === null) {
      return undefined;
    }

    if (value) {
      return BooleanType.true;
    }

    return BooleanType.false;
  }, [value]);

  return (
    <div className="max-w-[200px]">
      <DialSelect
        options={booleans || []}
        value={boolValue}
        onChange={(value) => onChange(value === BooleanType.true)}
      />
    </div>
  );
};
