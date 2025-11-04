import { FC } from 'react';

import { ButtonVariant, DialButton, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { WidgetHeader } from './WidgetHeader';

export const ArrayFieldTemplate: FC<ArrayFieldTemplateProps> = ({ canAdd, items, onAddClick, title, readonly }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <fieldset className="flex flex-col p-6 gap-3">
      {title && <WidgetHeader title={title} defaultHeader={true} />}

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
                  iconClass="text-error"
                  cssClass="border rounded border-primary justify-start p-2"
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
          title={`${t(ButtonsI18nKey.Add)} ${title}`}
          cssClass="w-fit"
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        />
      )}
    </fieldset>
  );
};
