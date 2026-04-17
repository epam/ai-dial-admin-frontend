'use client';

import { FC, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { IconEye, IconEyeOff } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialEllipsisTooltip, DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { useI18n } from '@/src/locales/client';

import { ComparisonSection } from './models';
import { SECTION_I18N } from './constants';
import { useFieldSelector } from './useFieldSelector';

interface Props {
  sections: ComparisonSection[];
  fieldSelector: ReturnType<typeof useFieldSelector>;
}

const OrderTab: FC<Props> = ({ sections, fieldSelector }) => {
  const t = useI18n();

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
                  <DialGhostIconButton
                    size={ElementSize.Small}
                    icon={isHidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    onClick={() => fieldSelector.toggleSectionHidden(section.key)}
                    className={classNames(isHidden && 'opacity-50')}
                  />
                </div>
              </DraggableItem>
            </div>
          );
        })}
      </div>
    </DndProvider>
  );
};

export default OrderTab;
