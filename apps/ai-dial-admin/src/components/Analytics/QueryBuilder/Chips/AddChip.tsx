'use client';

import { FC, ReactNode, useId, useState } from 'react';

import { Dropdown, DropdownOverlayRole, MenuItemMark } from '@epam/ai-dial-ui-kit';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import AggregatePanel from '@/src/components/Analytics/QueryBuilder/Chips/Aggregate/AggregatePanel';
import ColumnsPanel from '@/src/components/Analytics/QueryBuilder/Chips/Columns/ColumnsPanel';
import FilterPanel from '@/src/components/Analytics/QueryBuilder/Chips/Filter/FilterPanel';
import { ChipKind, ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import SortPanel from '@/src/components/Analytics/QueryBuilder/Chips/Sort/SortPanel';
import { hasAggregate } from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { ButtonsI18nKey, QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const PANELS: Record<ChipKind, FC<ChipPanelProps>> = {
  [ChipKind.Filter]: FilterPanel,
  [ChipKind.Aggregate]: AggregatePanel,
  [ChipKind.Columns]: ColumnsPanel,
  [ChipKind.Sort]: SortPanel,
};

const AddChip: FC = () => {
  const t = useI18n();
  const titleId = useId();
  const { state } = useQueryBuilder();
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<ChipKind | null>(null);

  const isAggregate = hasAggregate(state);
  const ToggleIcon = isOpen ? IconChevronUp : IconChevronDown;

  const onOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) setKind(null);
  };

  const entries: { kind: ChipKind; label: string; isDisabled: boolean }[] = [
    { kind: ChipKind.Filter, label: t(QueryBuilderI18nKey.Filter), isDisabled: false },
    { kind: ChipKind.Aggregate, label: t(QueryBuilderI18nKey.Aggregate), isDisabled: isAggregate },
    {
      kind: ChipKind.Columns,
      label: t(QueryChipsI18nKey.ShowColumns),
      isDisabled: isAggregate || state.select.length > 0,
    },
    { kind: ChipKind.Sort, label: t(QueryBuilderI18nKey.Sort), isDisabled: false },
  ];

  const items: DropdownItem[] = entries.map((entry) => ({
    key: entry.kind,
    label: entry.label,
    disabled: entry.isDisabled,
    selectable: true,
    mark: MenuItemMark.None,
    onClick: () => setKind(entry.kind),
  }));

  const renderPanel = (): ReactNode => {
    if (!kind) return null;
    const Panel = PANELS[kind];
    return <Panel titleId={titleId} onClose={() => onOpenChange(false)} onBack={() => setKind(null)} />;
  };

  return (
    <Dropdown
      open={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom-start"
      matchReferenceWidth={false}
      items={kind ? undefined : items}
      renderOverlay={kind ? renderPanel : undefined}
      overlayRole={kind ? DropdownOverlayRole.Dialog : DropdownOverlayRole.Menu}
      overlayAriaLabelledBy={kind ? titleId : undefined}
      listClassName={kind ? '!flex w-[400px] max-w-[90vw] !flex-col [&&]:!overflow-hidden' : 'w-[240px]'}
    >
      <button
        type="button"
        aria-label={t(QueryChipsI18nKey.AddPart)}
        aria-haspopup={kind ? 'dialog' : 'menu'}
        aria-expanded={isOpen}
        className="flex h-6 items-center gap-1 rounded-lg border border-accent-primary bg-accent-primary-alpha px-2 text-accent-primary dial-tiny-semi-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
      >
        {t(ButtonsI18nKey.Add)}
        <ToggleIcon size={12} aria-hidden />
      </button>
    </Dropdown>
  );
};

export default AddChip;
