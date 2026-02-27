import { FC } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { WidgetToggler } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetToggler';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

export const ArrayFieldTemplate: FC<ArrayFieldTemplateProps> = ({
  canAdd,
  items,
  onAddClick,
  title,
  readonly,
  schema,
}) => {
  const t = useI18n();
  return (
    <WidgetToggler title={title}>
      <fieldset className="flex flex-col py-6 pl-6 gap-3 bg-layer-1 w-full">
        {title && <WidgetHeader title={title} defaultHeader={true} caption={schema.description} />}

        <ul className="flex flex-col w-full gap-3">{items.map((item) => item)}</ul>

        {canAdd && !readonly && (
          <DialGhostButton
            onClick={onAddClick}
            label={`${t(ButtonsI18nKey.Add)} ${title}`}
            className="w-fit"
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}
      </fieldset>
    </WidgetToggler>
  );
};
