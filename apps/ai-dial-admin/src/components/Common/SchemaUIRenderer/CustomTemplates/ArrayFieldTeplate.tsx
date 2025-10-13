import { FC } from 'react';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import { IconPlus, IconTrashX } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

export const ArrayFieldTemplate: FC<ArrayFieldTemplateProps> = ({ canAdd, items, onAddClick, title }) => {
  return (
    <fieldset className="flex flex-col p-6 gap-3">
      {title && <p className="small">{title}</p>}

      <ul className="flex flex-col w-full gap-3">
        {items.map((item, key) => {
          const { children, hasRemove, onDropIndexClick } = item;
          return (
            <li key={key} className="flex w-full gap-3 items-start lg:w-[45%]">
              <div className="flex w-full bg-layer-2 p-[18px]">{children}</div>
              {hasRemove && (
                <DialButton
                  iconBefore={<IconTrashX {...BASE_ICON_PROPS} className="text-error" />}
                  onClick={onDropIndexClick(key)}
                  cssClass="border rounded border-primary justify-start p-2"
                />
              )}
            </li>
          );
        })}
      </ul>

      {canAdd && (
        <DialButton
          variant={ButtonVariant.Tertiary}
          onClick={onAddClick}
          title={`Add ${title}`}
          cssClass="w-fit"
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        />
      )}
    </fieldset>
  );
};
