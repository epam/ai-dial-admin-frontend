import { FC, useCallback, useEffect, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { EntityDefaults } from '@/src/models/dial/base-entity';
import { DefaultTemp } from '@/src/models/dial/defaults';
import DefaultItemDeclaration from './DefaultItem';
import { convertDefaultsToArray } from './utils';

interface Props {
  entity: EntityDefaults;
  onChangeEntity: (entity: EntityDefaults) => void;
  disabled?: boolean;
  title?: string;
  valuesKey?: 'defaults' | 'responsesDefaults';
  tempKey?: 'defaultsTemp' | 'responsesDefaultsTemp';
  validationKey?: string;
}

const Defaults: FC<Props> = ({
  entity,
  onChangeEntity,
  disabled,
  title,
  valuesKey = 'defaults',
  tempKey = 'defaultsTemp',
  validationKey = 'defaultKeys',
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  const [defaultItems, setDefaultItems] = useState<DefaultTemp[]>([]);
  const [count, setCount] = useState(0);

  const entityTempValues = entity[tempKey];
  const entityValues = entity[valuesKey];

  const onAddItem = useCallback(() => {
    const defaultsTemp = [...defaultItems, { key: '', value: '', type: 'string' }];
    onChangeEntity({ ...entity, [tempKey]: defaultsTemp });
  }, [defaultItems, entity, onChangeEntity, tempKey]);

  const onRemoveItem = useCallback(
    (index: number) => {
      const defaultsTemp = [...defaultItems];
      defaultsTemp.splice(index, 1);
      onChangeEntity({ ...entity, [tempKey]: defaultsTemp });
    },
    [defaultItems, entity, onChangeEntity, tempKey],
  );

  const onChangeDefaultItem = useCallback(
    (item: DefaultTemp, index: number) => {
      const defaultsTemp = [...defaultItems];
      defaultsTemp.splice(index, 1, item);
      onChangeEntity({ ...entity, [tempKey]: defaultsTemp });
    },
    [defaultItems, entity, onChangeEntity, tempKey],
  );

  useEffect(() => {
    if (entityTempValues) {
      setDefaultItems(entityTempValues);
    } else {
      const defaults = convertDefaultsToArray(entityValues || {});
      setDefaultItems(defaults);
    }
    dispatch({
      type: ValidationActionType.SetField,
      field: validationKey,
      isValid: !entityTempValues?.some((d) => !d.key),
    });
    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: validationKey });
    };
  }, [dispatch, entityValues, entityTempValues, validationKey]);

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
