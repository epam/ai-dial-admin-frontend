import { FC, useCallback, useEffect, useState } from 'react';

import { IconPlus } from '@tabler/icons-react';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { EntityDefaults } from '@/src/models/dial/base-entity';
import { DefaultTemp } from '@/src/models/dial/defaults';
import { convertDefaultsToArray } from './utils';

import DefaultItemDeclaration from './DefaultItem';
import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  entity: EntityDefaults;
  onChangeEntity: (entity: EntityDefaults) => void;
  disabled?: boolean;
}

const Defaults: FC<Props> = ({ entity, onChangeEntity, disabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  const [defaultItems, setDefaultItems] = useState<DefaultTemp[]>([]);
  const [count, setCount] = useState(0);

  const onAddItem = useCallback(() => {
    const defaultsTemp = [...defaultItems, { key: '', value: '', type: 'string' }];
    onChangeEntity({ ...entity, defaultsTemp });
  }, [defaultItems, entity, onChangeEntity]);

  const onRemoveItem = useCallback(
    (index: number) => {
      const defaultsTemp = [...defaultItems];
      defaultsTemp.splice(index, 1);
      onChangeEntity({ ...entity, defaultsTemp });
    },
    [defaultItems, entity, onChangeEntity],
  );

  const onChangeDefaultItem = useCallback(
    (item: DefaultTemp, index: number) => {
      const defaultsTemp = [...defaultItems];
      defaultsTemp.splice(index, 1, item);
      onChangeEntity({ ...entity, defaultsTemp });
    },
    [defaultItems, entity, onChangeEntity],
  );

  useEffect(() => {
    if (entity.defaultsTemp) {
      setDefaultItems(entity.defaultsTemp || []);
    } else {
      const defaults = convertDefaultsToArray(entity.defaults || {});
      setDefaultItems(defaults);
    }
  }, [entity.defaults, entity.defaultsTemp]);

  useEffect(() => {
    if (defaultItems.length === 1 && !defaultItems[0].key && !defaultItems[0].value) {
      setCount(0);
    } else {
      setCount(defaultItems.length);
    }
  }, [defaultItems]);

  return (
    <Accordion title={`${t(EntityFieldsI18nKey.defaults)}: ${count}`} contentClassName="gap-2">
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
