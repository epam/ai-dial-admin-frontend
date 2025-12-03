import { FC } from 'react';

import { ButtonVariant, DialButton, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { WidgetToggler } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetToggler';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

export const ArrayFieldTemplate: FC<ArrayFieldTemplateProps> = ({
  canAdd,
  items,
  onAddClick,
  title,
  readonly,
  schema,
}) => {
  const t = useI18n()

  return (
    <WidgetToggler title={title}>
      <fieldset className="flex flex-col py-6 pl-6 gap-3 bg-layer-1 w-full">
        {title && <WidgetHeader title={title} defaultHeader={true} description={schema.description} />}

        <ul className="flex flex-col w-full gap-3">
          {items.map((item, key) => {
            const { children, hasRemove, onDropIndexClick, schema } = item;
            const isString = schema.type === 'string';
            return (
              <li key={key} className={classNames('flex w-full gap-3 items-start', isString && 'lg:w-[45%]')}>
                {children}
                {hasRemove && !readonly && (
                  <DialRemoveButton
                    onClick={onDropIndexClick(key)}
                    iconClassName="text-error"
                    className="border rounded border-primary justify-start p-2"
                  />
                )}
              </li>
            );
          })}
        </ul>

        {canAdd && !readonly && (
          <DialButton
            variant={ButtonVariant.Tertiary}
            onClick={onAddClick}
            label={`${t(ButtonsI18nKey.Add)} ${title}`}
            className="w-fit"
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          />
        )}
      </fieldset>
    </WidgetToggler>
  );
};
