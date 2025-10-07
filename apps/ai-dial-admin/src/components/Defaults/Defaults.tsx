import { FC, useCallback, useEffect, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntityDefaults } from '@/src/models/dial/base-entity';
import { DefaultTemp } from '@/src/models/dial/defaults';
import DefaultItem from './DefaultItem';
import { convertDefaultsToArray } from './utils';

interface Props {
  entity: EntityDefaults;
  onChangeEntity: (entity: EntityDefaults) => void;
}

const Defaults: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const [defaultItems, setDefaultItems] = useState<DefaultTemp[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [count, setCount] = useState(0);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

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
    <div className="flex flex-col p-4 rounded border border-primary">
      <button className="flex items-center justify-between" onClick={toggleCollapse}>
        <div className="flex flex-row">
          <i className="text-icon-secondary">
            {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
          </i>
          <h3 className="mx-2">
            {t(EntityFieldsI18nKey.defaults)}: {count}
          </h3>
        </div>
      </button>
      <div className={classNames('flex flex-col gap-2 px-6 pt-4', isCollapsed && 'hidden')}>
        {defaultItems.map((item, index) => (
          <DefaultItem key={index} item={item} index={index} changeItem={onChangeDefaultItem} onRemove={onRemoveItem} />
        ))}
        <div>
          <DialButton
            variant={ButtonVariant.Tertiary}
            title={t(ButtonsI18nKey.AddDefault)}
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            onClick={onAddItem}
          />
        </div>
      </div>
    </div>
  );
};

export default Defaults;
