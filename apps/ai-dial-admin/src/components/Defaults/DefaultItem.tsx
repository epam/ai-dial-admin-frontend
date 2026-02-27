'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialInput, DialNumberInput, DialRemoveButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import {
  BasicI18nKey,
  BooleanI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  TypeI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { BooleanType } from '@/src/types/boolean';
import { DefaultItemType } from './types';
import { getDefaultValueByType, getValueByType } from './utils';

interface DefaultItem {
  key: string;
  value: DefaultsValue;
  type: string;
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
  const types: SelectOption[] = useMemo(
    () => [
      {
        value: DefaultItemType.string,
        label: t(TypeI18nKey.String),
      },
      {
        value: DefaultItemType.number,
        label: t(TypeI18nKey.Number),
      },
      {
        value: DefaultItemType.boolean,
        label: t(TypeI18nKey.Boolean),
      },
      {
        value: DefaultItemType.object,
        label: t(TypeI18nKey.Object),
      },
    ],
    [t],
  );
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

  const onChangeValue = useCallback(
    (v?: string | number | boolean | object, newType?: string) => {
      const type = newType || item.type;
      const value = getValueByType(v, type);
      changeItem({ ...item, value, type }, index);
    },
    [changeItem, item, index],
  );

  const onChangeKey = useCallback(
    (key?: string) => {
      changeItem({ ...item, key: key || '' }, index);
    },
    [changeItem, index, item],
  );

  const onChangeType = useCallback(
    (newType: string) => {
      if (newType !== item.type) {
        const value = getDefaultValueByType(newType as DefaultItemType);
        onChangeValue(value, newType);
      }
    },
    [item.type, onChangeValue],
  );

  return (
    <div className="flex gap-x-3 items-end">
      <div className="flex flex-row gap-x-4 items-center">
        <div className="min-w-[187px]">
          <DialInput
            id={`entity-default-key-${index}`}
            value={item.key}
            placeholder={t(EntityPlaceholdersI18nKey.Key)}
            labelProps={{ label: isFirstLine ? t(EntityFieldsI18nKey.key) : '' }}
            onChange={onChangeKey}
          />
        </div>
        <div className="w-[384px]">
          {item.type === DefaultItemType.string && (
            <DialInput
              id={`entity-default-value-${index}`}
              value={item.value as string}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              labelProps={{ label: isFirstLine ? t(BasicI18nKey.Value) : '' }}
              onChange={onChangeValue}
            />
          )}
          {item.type === DefaultItemType.number && (
            <DialNumberInput
              id={`entity-default-value-${index}`}
              value={item.value as string}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              labelProps={{ label: isFirstLine ? t(BasicI18nKey.Value) : '' }}
              onChange={onChangeValue}
            />
          )}
          {item.type === DefaultItemType.boolean && (
            <DialSelectField
              value={item.value.toString()}
              id={`entity-default-value=${index}`}
              options={booleans}
              label={isFirstLine ? t(BasicI18nKey.Value) : ''}
              onChange={onChangeValue}
            />
          )}
          {item.type === DefaultItemType.object && (
            <JsonEditorInput
              elementId={`entity-default-value-${index}`}
              value={item.value as object}
              label={isFirstLine ? t(BasicI18nKey.Value) : ''}
              onChangeValue={onChangeValue}
            />
          )}
        </div>
        <div className="min-w-[136px]">
          <DialSelectField
            value={item.type}
            id={`entity-default-type-${index}`}
            options={types}
            label={isFirstLine ? t(EntityFieldsI18nKey.type) : ''}
            onChange={(type) => onChangeType(type as string)}
          />
        </div>
      </div>
      <div className="w-[40px] flex-shrink-0 mt-[10px]">
        <DialRemoveButton onClick={() => onRemove(index)} />
      </div>
    </div>
  );
};
export default DefaultItem;
