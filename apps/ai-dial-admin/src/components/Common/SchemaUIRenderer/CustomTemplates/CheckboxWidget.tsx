import { FC, useMemo } from 'react';

import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { BooleanI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BooleanType } from '@/src/types/boolean';

export const CheckboxWidget: FC<WidgetProps> = ({ value, onChange, label, schema }) => {
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
    <div className="flex flex-col w-full bg-layer-2 py-[18px] pl-[18px] w-full">
      {label && <WidgetHeader title={label} defaultHeader={true} description={schema.description} />}
      <DialSelect
        cssClass="max-w-[200px]"
        options={booleans || []}
        value={boolValue}
        onChange={(value) => onChange(value === BooleanType.true)}
      />
    </div>
  );
};
