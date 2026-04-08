'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { IconChevronDown, IconChevronRight, IconEye, IconEyeOff, IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { ComparisonSection } from './models';
import { useFieldSelector } from './useFieldSelector';
import { SECTION_I18N } from './utils';

interface Props {
  sections: ComparisonSection[];
  fieldSelector: ReturnType<typeof useFieldSelector>;
}

type Tab = 'fields' | 'order';

const FieldSelector: FC<Props> = ({ sections, fieldSelector }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('fields');
  const [collapsedFieldSections, setCollapsedFieldSections] = useState<Record<string, boolean>>({});

  const onToggleFieldSectionCollapse = useCallback((key: string) => {
    setCollapsedFieldSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const displaySections = activeTab === 'fields' ? fieldSelector.filteredSections : sections;

  // DnD helpers for Order tab
  const findItem = useCallback(
    (id: string) => {
      return fieldSelector.sectionOrder.indexOf(id);
    },
    [fieldSelector.sectionOrder],
  );

  const moveItem = useCallback(
    (id: string, atIndex: number) => {
      const currentIndex = fieldSelector.sectionOrder.indexOf(id);
      if (currentIndex === -1 || currentIndex === atIndex) return;
      const newOrder = [...fieldSelector.sectionOrder];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(atIndex, 0, id);
      fieldSelector.reorderSections(newOrder);
    },
    [fieldSelector],
  );

  const orderedSections = useMemo(() => {
    const map = new Map(sections.map((s) => [s.key, s]));
    return fieldSelector.sectionOrder.map((key) => map.get(key)).filter((s): s is ComparisonSection => s != null);
  }, [sections, fieldSelector.sectionOrder]);

  return (
    <div className="w-[250px] border-r border-secondary flex flex-col shrink-0 overflow-hidden">
      <div className="flex border-b border-secondary">
        <button
          onClick={() => setActiveTab('fields')}
          className={classNames(
            'flex-1 py-1.5 text-xxs font-medium text-center',
            activeTab === 'fields'
              ? 'text-primary border-b-2 border-accent-primary'
              : 'text-secondary hover:text-primary',
          )}
        >
          {t(RunsI18nKey.Fields)}
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={classNames(
            'flex-1 py-1.5 text-xxs font-medium text-center',
            activeTab === 'order'
              ? 'text-primary border-b-2 border-accent-primary'
              : 'text-secondary hover:text-primary',
          )}
        >
          {t(RunsI18nKey.Order)}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'fields' && (
          <>
            <div className="p-1.5">
              <div className="flex items-center gap-1 bg-layer-2 rounded px-1.5 py-1">
                <IconSearch size={12} className="text-secondary shrink-0" />
                <input
                  type="text"
                  value={fieldSelector.searchQuery}
                  onChange={(e) => fieldSelector.setSearchQuery(e.target.value)}
                  placeholder={t(RunsI18nKey.Search)}
                  className="bg-transparent text-xxs text-primary placeholder:text-secondary outline-none flex-1 min-w-0"
                />
              </div>
            </div>
            {displaySections.map((section) => {
              const isCollapsed = collapsedFieldSections[section.key];
              const i18nKey = SECTION_I18N[section.key];
              const sectionLabel = i18nKey ? t(i18nKey) : section.label;
              const allChecked = section.rows.every((r) => {
                const visKey = `${section.key}:${r.fieldKey}`;
                return fieldSelector.fieldVisibility[visKey] !== false;
              });

              return (
                <div key={section.key}>
                  <div className="flex items-center gap-1 px-1.5 py-1 hover:bg-layer-2">
                    <button
                      onClick={() => onToggleFieldSectionCollapse(section.key)}
                      className="flex items-center gap-1 flex-1 min-w-0 dial-tiny-semi-text text-secondary uppercase"
                    >
                      {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
                      <DialEllipsisTooltip text={sectionLabel} />
                      <span className="text-secondary ml-auto shrink-0 normal-case">({section.rows.length})</span>
                    </button>
                    <button
                      onClick={() =>
                        allChecked
                          ? fieldSelector.deselectAllInSection(
                              section.key,
                              section.rows.map((r) => r.fieldKey),
                            )
                          : fieldSelector.selectAllInSection(
                              section.key,
                              section.rows.map((r) => r.fieldKey),
                            )
                      }
                      className="dial-tiny-text text-accent-primary hover:underline shrink-0"
                    >
                      {allChecked ? t(RunsI18nKey.DeselectAll) : t(RunsI18nKey.SelectAll)}
                    </button>
                  </div>
                  {!isCollapsed &&
                    section.rows.map((row) => {
                      const visKey = `${section.key}:${row.fieldKey}`;
                      const isVisible = fieldSelector.fieldVisibility[visKey] !== false;
                      return (
                        <label
                          key={visKey}
                          className="flex items-center gap-1.5 px-3 py-0.5 hover:bg-layer-2 cursor-pointer font-mono"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => fieldSelector.toggleField(visKey)}
                            className="shrink-0 accent-accent-primary"
                          />
                          <span className="text-primary truncate" title={row.label}>
                            {row.label}
                          </span>
                        </label>
                      );
                    })}
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'order' && (
          <DndProvider backend={HTML5Backend}>
            <div className="p-1.5">
              {orderedSections.map((section, idx) => {
                const isHidden = fieldSelector.sectionHidden[section.key];
                const orderI18nKey = SECTION_I18N[section.key];
                const orderLabel = orderI18nKey ? t(orderI18nKey) : section.label;
                return (
                  <div
                    key={section.key}
                    tabIndex={0}
                    role="listitem"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        fieldSelector.moveSectionByKeyboard(section.key, 'up');
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        fieldSelector.moveSectionByKeyboard(section.key, 'down');
                      }
                    }}
                    className="focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary rounded"
                  >
                    <DraggableItem id={section.key} findItem={findItem} moveItem={moveItem}>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 py-0.5">
                        <span className="dial-tiny-text text-secondary w-4 text-right shrink-0">{idx + 1}</span>
                        <DialEllipsisTooltip
                          text={orderLabel}
                          className={classNames(
                            'dial-tiny-text flex-1',
                            isHidden ? 'text-secondary line-through' : 'text-primary',
                          )}
                        />
                        <button
                          onClick={() => fieldSelector.toggleSectionHidden(section.key)}
                          className={classNames(
                            'shrink-0',
                            isHidden ? 'text-secondary opacity-50' : 'text-secondary hover:text-primary',
                          )}
                        >
                          {isHidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        </button>
                      </div>
                    </DraggableItem>
                  </div>
                );
              })}
            </div>
          </DndProvider>
        )}
      </div>
    </div>
  );
};

export default FieldSelector;
