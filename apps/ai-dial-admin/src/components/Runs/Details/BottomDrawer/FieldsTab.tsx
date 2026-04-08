'use client';

import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { DialCheckbox, DialEllipsisTooltip, DialSearch, ElementSize } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { SECTION_I18N } from './constants';
import { useFieldSelector } from './useFieldSelector';

interface Props {
  fieldSelector: ReturnType<typeof useFieldSelector>;
}

const FieldsTab: FC<Props> = ({ fieldSelector }) => {
  const t = useI18n();
  const [collapsedFieldSections, setCollapsedFieldSections] = useState<Record<string, boolean>>({});

  const onToggleFieldSectionCollapse = useCallback((key: string) => {
    setCollapsedFieldSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const displaySections = fieldSelector.filteredSections;

  return (
    <>
      <div className="p-1.5">
        <DialSearch
          id="field-search"
          value={fieldSelector.searchQuery}
          onChange={fieldSelector.setSearchQuery}
          placeholder={t(BasicI18nKey.Search)}
          size={ElementSize.Small}
        />
      </div>
      {displaySections.map((section) => {
        const isCollapsed = collapsedFieldSections[section.key];
        const i18nKey = SECTION_I18N[section.key];
        const sectionLabel = i18nKey ? t(i18nKey) : section.label;
        const allChecked = section.rows.every((r) => {
          const visKey = `${section.key}:${r.fieldKey}`;
          return fieldSelector.fieldVisibility[visKey] !== false;
        });

        const onToggleAll = () =>
          allChecked
            ? fieldSelector.deselectAllInSection(
                section.key,
                section.rows.map((r) => r.fieldKey),
              )
            : fieldSelector.selectAllInSection(
                section.key,
                section.rows.map((r) => r.fieldKey),
              );

        return (
          <div key={section.key}>
            <div className="flex items-center gap-1 px-1.5 py-1 hover:bg-layer-2">
              <DialCheckbox id={`section-${section.key}`} checked={allChecked} onChange={onToggleAll} />
              <button
                onClick={() => onToggleFieldSectionCollapse(section.key)}
                className="flex items-center gap-1 flex-1 min-w-0 dial-caption-semi-text text-secondary"
              >
                {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
                <DialEllipsisTooltip text={sectionLabel} />
              </button>
              <span className="dial-tiny-text text-secondary shrink-0">({section.rows.length})</span>
            </div>
            {!isCollapsed &&
              section.rows.map((row) => {
                const visKey = `${section.key}:${row.fieldKey}`;
                const isVisible = fieldSelector.fieldVisibility[visKey] !== false;
                return (
                  <div key={visKey} className="flex items-center gap-1.5 px-3 py-1 hover:bg-layer-2 font-mono">
                    <DialCheckbox
                      id={visKey}
                      checked={isVisible}
                      onChange={() => fieldSelector.toggleField(visKey)}
                      label={
                        <span className="text-primary truncate" title={row.label}>
                          {row.label}
                        </span>
                      }
                    />
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
};

export default FieldsTab;
