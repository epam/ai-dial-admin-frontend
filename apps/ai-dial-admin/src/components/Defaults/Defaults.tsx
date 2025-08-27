import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DefaultsValue, DialBaseEntity } from '@/src/models/dial/base-entity';
import DefaultItem from './DefaultItem';
import { convertDefaultsToArray, convertDefaultsToRecord } from './utils';

interface Props {
  entity: DialBaseEntity;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

interface InnerDefault {
  key: string;
  value: DefaultsValue;
}

const Defaults: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const [defaultItems, setDefaultItems] = useState<InnerDefault[]>([]);
  const isAddDisable = useMemo(() => defaultItems.some((i) => i.key === ''), [defaultItems]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const onAddItem = useCallback(() => {
    const defaults = { ...entity.defaults, '': '' };
    onChangeEntity({ ...entity, defaults });
  }, [entity, onChangeEntity]);

  const onRemoveItem = useCallback(
    (index: number) => {
      const innerDefaults = [...defaultItems];
      innerDefaults.splice(index, 1);
      const defaults = convertDefaultsToRecord(innerDefaults);
      onChangeEntity({ ...entity, defaults });
    },
    [defaultItems, entity, onChangeEntity],
  );

  const onChangeDefaultItem = useCallback(
    (item: InnerDefault, index: number) => {
      const innerDefaults = [...defaultItems];
      innerDefaults.splice(index, 1, item);
      const defaults = convertDefaultsToRecord(innerDefaults);
      onChangeEntity({ ...entity, defaults });
    },
    [defaultItems, entity, onChangeEntity],
  );

  useEffect(() => {
    const converted = convertDefaultsToArray(entity.defaults || {});
    setDefaultItems(converted);
  }, [entity.defaults]);

  return (
    <div className="flex flex-col p-4 rounded border border-primary">
      <button className="flex items-center justify-between" onClick={toggleCollapse}>
        <div className="flex flex-row">
          <i className="text-icon-secondary">
            {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
          </i>
          <h3 className="mx-2">
            {t(EntityFieldsI18nKey.defaults)}: {defaultItems.length}
          </h3>
        </div>
      </button>
      <div className={classNames('flex flex-col gap-2 px-6 pt-4', isCollapsed && 'hidden')}>
        {defaultItems.map((item, index) => (
          <DefaultItem key={index} item={item} index={index} changeItem={onChangeDefaultItem} onRemove={onRemoveItem} />
        ))}
        <div>
          <Button
            cssClass="tertiary"
            title={t(ButtonsI18nKey.AddDefault)}
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            onClick={onAddItem}
            disable={isAddDisable}
          />
        </div>
      </div>
    </div>
  );
};

export default Defaults;
