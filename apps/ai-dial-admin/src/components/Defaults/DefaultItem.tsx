'use client';

import { FC, useCallback, useMemo } from 'react';

import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import {
  BasicI18nKey,
  BooleanI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  TypeI18nKey,
} from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DefaultsValue } from '@/src/models/dial/base-entity';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { DefaultItemType } from './types';
import { getDefaultValueByType, getDefaultValueType, getValueByType } from './utils';
import { BooleanType } from '@/src/types/boolean';

interface DefaultItem {
  key: string;
  value: DefaultsValue;
}

interface Props {
  index: number;
  item: DefaultItem;
  changeItem: (item: DefaultItem, index: number) => void;
  onRemove: (index: number) => void;
}

const DefaultItem: FC<Props> = ({ index, item, changeItem, onRemove }) => {
  const t = useI18n();
  const isFirstLine = index === 0;
  const types: DropdownItemsModel[] = useMemo(
    () => [
      {
        id: DefaultItemType.string,
        name: t(TypeI18nKey.String),
      },
      {
        id: DefaultItemType.number,
        name: t(TypeI18nKey.Number),
      },
      {
        id: DefaultItemType.boolean,
        name: t(TypeI18nKey.Boolean),
      },
    ],
    [t],
  );
  const booleans: DropdownItemsModel[] = useMemo(
    () => [
      {
        id: BooleanType.true,
        name: t(BooleanI18nKey.true),
      },
      {
        id: BooleanType.false,
        name: t(BooleanI18nKey.false),
      },
    ],
    [t],
  );
  const type = useMemo(() => types.find((t) => t.id === getDefaultValueType(item.value)), [item.value, types]);

  const onChangeValue = useCallback(
    (v?: string | number | boolean, newType?: string) => {
      const value = getValueByType(v, (newType || type?.id) as DefaultItemType);
      changeItem({ ...item, value }, index);
    },
    [type?.id, changeItem, item, index],
  );

  const onChangeKey = useCallback(
    (key?: string) => {
      changeItem({ ...item, key: key || '' }, index);
    },
    [changeItem, index, item],
  );

  const onChangeType = useCallback(
    (newType: string) => {
      if (newType !== type?.id) {
        const value = getDefaultValueByType(newType as DefaultItemType);
        onChangeValue(value, newType);
      }
    },
    [onChangeValue, type],
  );

  return (
    <div className="flex gap-4 items-start">
      <div className={classNames('flex flex-row gap-x-4 items-center')}>
        <div className="min-w-[187px]">
          <TextInputField
            elementId={'entity-default-key ' + index}
            value={item.key}
            placeholder={t(EntityPlaceholdersI18nKey.Key)}
            fieldTitle={isFirstLine ? t(EntityFieldsI18nKey.key) : ''}
            onChange={onChangeKey}
          />
        </div>
        <div className={classNames('min-w-[384px]')}>
          {type?.id === DefaultItemType.string && (
            <TextInputField
              elementId={'entity-default-value ' + index}
              value={item.value as string}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              fieldTitle={isFirstLine ? t(BasicI18nKey.Value) : ''}
              onChange={onChangeValue}
            />
          )}
          {type?.id === DefaultItemType.number && (
            <NumberInputField
              elementId={'entity-default-value ' + index}
              value={item.value as string}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              fieldTitle={isFirstLine ? t(BasicI18nKey.Value) : ''}
              onChange={onChangeValue}
            />
          )}
          {type?.id === DefaultItemType.boolean && (
            <DropdownField
              selectedValue={item.value.toString()}
              elementId={'entity-default-value ' + index}
              items={booleans}
              fieldTitle={isFirstLine ? t(EntityFieldsI18nKey.type) : ''}
              onChange={onChangeValue}
            />
          )}
        </div>
        <div className={classNames('min-w-[136px]')}>
          <DropdownField
            selectedValue={type?.id}
            elementId={'entity-default-type ' + index}
            items={types}
            fieldTitle={isFirstLine ? t(EntityFieldsI18nKey.type) : ''}
            onChange={onChangeType}
          />
        </div>
      </div>

      <button
        className={classNames('text-error cursor-pointer mt-[10px]', index === 0 && 'lg:mt-[32px]')}
        onClick={() => onRemove(index)}
        aria-label="remove"
      >
        <IconTrash {...BASE_ICON_PROPS} />
      </button>
    </div>
  );
};
export default DefaultItem;
