import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DefaultTemp } from '@/src/models/dial/defaults';
import DefaultItemDeclaration from './DefaultItem';
import { convertDefaultsToArray, convertDefaultsToRecord } from './utils';

interface Props {
  values?: Record<string, unknown>;
  onChangeValues: (values: Record<string, unknown>) => void;
  disabled?: boolean;
  title?: string;
  validationKey?: string;
}

const Defaults: FC<Props> = ({ values, onChangeValues, disabled, title, validationKey = 'defaultKeys' }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  const [defaultItems, setDefaultItems] = useState<DefaultTemp[]>(() => convertDefaultsToArray(values || {}));
  const [count, setCount] = useState(0);
  const isLocalChangeRef = useRef(false);

  const onAddItem = useCallback(() => {
    const newItems = [...defaultItems, { key: '', value: '', type: 'string' }];
    setDefaultItems(newItems);
    isLocalChangeRef.current = true;
    onChangeValues(convertDefaultsToRecord(newItems));
  }, [defaultItems, onChangeValues]);

  const onRemoveItem = useCallback(
    (index: number) => {
      const newItems = [...defaultItems];
      newItems.splice(index, 1);
      setDefaultItems(newItems);
      isLocalChangeRef.current = true;
      onChangeValues(convertDefaultsToRecord(newItems));
    },
    [defaultItems, onChangeValues],
  );

  const onChangeDefaultItem = useCallback(
    (item: DefaultTemp, index: number) => {
      const newItems = [...defaultItems];
      newItems.splice(index, 1, item);
      setDefaultItems(newItems);
      isLocalChangeRef.current = true;
      onChangeValues(convertDefaultsToRecord(newItems));
    },
    [defaultItems, onChangeValues],
  );

  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    setDefaultItems(convertDefaultsToArray(values || {}));
  }, [values]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: validationKey,
      isValid: !defaultItems.some((d) => !d.key),
    });
    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: validationKey });
    };
  }, [dispatch, defaultItems, validationKey]);

  useEffect(() => {
    if (defaultItems.length === 1 && !defaultItems[0].key && !defaultItems[0].value) {
      setCount(0);
    } else {
      setCount(defaultItems.length);
    }
  }, [defaultItems]);

  return (
    <Accordion title={`${title ?? t(EntityFieldsI18nKey.defaults)}: ${count}`} contentClassName="gap-2">
      {defaultItems.map((item, index) => (
        <DefaultItemDeclaration
          key={index}
          item={item}
          index={index}
          changeItem={onChangeDefaultItem}
          onRemove={onRemoveItem}
          disabled={isReadonly}
        />
      ))}
      {!isReadonly && (
        <div>
          <DialGhostButton
            label={t(ButtonsI18nKey.AddDefault)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddItem}
          />
        </div>
      )}
    </Accordion>
  );
};

export default Defaults;
