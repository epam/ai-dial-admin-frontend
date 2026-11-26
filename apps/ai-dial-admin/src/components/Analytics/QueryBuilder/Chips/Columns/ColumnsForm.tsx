'use client';

import { FC, useId, useMemo, useState } from 'react';

import { Badge, Checkbox, ElementSize, GhostIconButton } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled, IconShield } from '@tabler/icons-react';
import classNames from 'classnames';

import { selectedCount, toggledColumns } from '@/src/components/Analytics/QueryBuilder/Chips/utils/columns';
import { groupColumnsByTag } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { QueryChipsI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  selected: string[];
  fields: AnalyticsEntityField[];
  onChange: (selected: string[]) => void;
}

const names = (fields: AnalyticsEntityField[]): string[] => fields.map((field) => field.name);

const ColumnsForm: FC<Props> = ({ selected, fields, onChange }) => {
  const t = useI18n();
  const id = useId();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const tree = useMemo(() => groupColumnsByTag(fields), [fields]);
  const total = selectedCount(selected, fields);

  const onToggle = (targets: string[], isSelected: boolean) => onChange(toggledColumns(selected, targets, isSelected));

  const onToggleGroup = (tag: string) =>
    setCollapsed((prev) => (prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag]));

  const renderField = (field: AnalyticsEntityField) => (
    <li
      key={field.name}
      className={classNames(
        'flex h-8 items-center gap-2 rounded pl-10 pr-3 hover:bg-control-accent-alpha',
        selected.includes(field.name) && 'bg-control-accent-alpha',
      )}
    >
      <div className="min-w-0 flex-1">
        <Checkbox
          id={`${id}-${field.name}`}
          labelProps={{ label: field.display_name || field.name, className: 'dial-small-text' }}
          isSelected={selected.includes(field.name)}
          onChange={(value) => onToggle([field.name], value)}
        />
      </div>
      {field.sensitive && (
        <IconShield
          size={12}
          className="shrink-0 text-warning"
          role="img"
          aria-label={t(QuerySourcePanelI18nKey.SensitiveData)}
        />
      )}
    </li>
  );

  return (
    <div className="relative flex max-h-[360px] flex-col gap-0.5 overflow-y-auto">
      <div className="flex h-8 items-center rounded px-3 hover:bg-control-accent-alpha">
        <Checkbox
          id={`${id}-all`}
          labelProps={{ label: t(QueryChipsI18nKey.AllColumns), className: 'dial-small-text' }}
          isSelected={total > 0 && total === fields.length}
          isIndeterminate={total > 0 && total < fields.length}
          onChange={(value) => onToggle(names(fields), value)}
        />
      </div>
      {tree.groups.map((group) => {
        const count = selectedCount(selected, group.fields);
        const isExpanded = !collapsed.includes(group.tag);
        const listId = `${id}-group-${group.tag}`;
        const ToggleIcon = isExpanded ? IconCaretDownFilled : IconCaretRightFilled;

        return (
          <div key={group.tag} className="flex flex-col gap-0.5">
            <div className="flex h-8 items-center gap-1 rounded pl-1 pr-3 hover:bg-control-accent-alpha">
              <GhostIconButton
                size={ElementSize.Small}
                aria-label={t(QueryChipsI18nKey.GroupColumns, { tag: group.tag })}
                aria-expanded={isExpanded}
                aria-controls={listId}
                icon={<ToggleIcon size={12} aria-hidden />}
                onClick={() => onToggleGroup(group.tag)}
              />
              <Checkbox
                id={`${id}-tag-${group.tag}`}
                aria-label={group.tag}
                isSelected={count > 0 && count === group.fields.length}
                isIndeterminate={count > 0 && count < group.fields.length}
                onChange={(value) => onToggle(names(group.fields), value)}
              />
              <Badge label={group.tag} />
              <span className="ml-auto text-secondary dial-tiny-text">
                {t(QueryChipsI18nKey.GroupSelected, { selected: String(count), total: String(group.fields.length) })}
              </span>
            </div>
            {isExpanded && (
              <ul id={listId} className="flex flex-col gap-0.5">
                {group.fields.map(renderField)}
              </ul>
            )}
          </div>
        );
      })}
      {tree.untagged.length > 0 && <ul className="flex flex-col gap-0.5">{tree.untagged.map(renderField)}</ul>}
    </div>
  );
};

export default ColumnsForm;
