'use client';

import { DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconGripVertical } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import CloseButton from '@/src/components/Common/CloseButton/CloseButton';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import TreeColumnNode from './TreeColumnNode';
import { TreeColumnsPanelDiffSection } from './models';

interface Props {
  columns: ColDef[];
  onColumnsChange: (columns: ColDef[]) => void;
  panelClassName: string;
  toggleColumnsPanel?: () => void;
  skipLeafNames?: string[];
  title?: string;
  renderLabel?: (node: ColDef, displayLabel: string) => ReactNode;
  diffSection?: TreeColumnsPanelDiffSection;
  treeSubtitle?: string;
  topSlot?: ReactNode;
}

const DEFAULT_SKIP_LEAF_NAMES: string[] = [];
const DRAG_TYPE = 'tree-column';

const getColId = (col: ColDef, i: number): string => {
  const ctx = col.context as { panelName?: string } | undefined;
  return ctx?.panelName || col.headerName?.trim() || String(i);
};

interface DraggableTreeItemProps {
  id: string;
  onMove: (dragId: string, targetId: string) => void;
  onCommit: () => void;
  children: ReactNode;
}

// useDrag and useDrop deps are [id] — never change during a drag, so no re-registration,
// no blinking, and hover events keep firing after the first reorder.
// onMove and onCommit are accessed via refs to stay current without being in deps.
const DraggableTreeItem: FC<DraggableTreeItemProps> = ({ id, onMove, onCommit, children }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const [{ isDragging }, drag, preview] = useDrag<{ id: string }, unknown, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPE,
      item: { id },
      collect: (m) => ({ isDragging: m.isDragging() }),
      end: () => onCommitRef.current(),
    }),
    [id],
  );

  const [, drop] = useDrop<{ id: string }>(
    () => ({
      accept: DRAG_TYPE,
      hover: (dragItem) => {
        if (dragItem.id !== id) {
          onMoveRef.current(dragItem.id, id);
        }
      },
    }),
    [id],
  );

  preview(drop(previewRef));
  drag(dragRef);

  return (
    <div ref={previewRef} className="flex items-center" style={{ opacity: isDragging ? 0 : 1 }}>
      <div ref={dragRef} className="mr-3 cursor-move text-secondary shrink-0">
        <IconGripVertical {...BASE_BUTTON_ICON_PROPS} />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

const DEFAULT_SWITCH_ID_PREFIX = 'tree-columns-panel';

const TreeColumnsPanelDiffSwitches: FC<TreeColumnsPanelDiffSection> = ({
  differencesTitle,
  viewDifferencesOnly,
  onViewDifferencesOnlyChange,
  viewDifferencesOnlyLabel,
  hideHighlights,
  onHideHighlightsChange,
  hideHighlightsLabel,
  switchIdPrefix = DEFAULT_SWITCH_ID_PREFIX,
}) => (
  <div className="flex flex-col gap-4 mb-4 pb-4">
    <h3 className="dial-tiny-text text-secondary">{differencesTitle}</h3>
    <DialSwitch
      switchId={`${switchIdPrefix}-view-differences-only`}
      label={viewDifferencesOnlyLabel}
      isOn={viewDifferencesOnly}
      onChange={onViewDifferencesOnlyChange}
    />
    <DialSwitch
      switchId={`${switchIdPrefix}-hide-highlights`}
      label={hideHighlightsLabel}
      isOn={hideHighlights}
      onChange={onHideHighlightsChange}
    />
  </div>
);

interface InnerProps extends Props {
  t: (key: string) => string;
}

const TreeColumnsPanelInner: FC<InnerProps> = ({
  columns,
  onColumnsChange,
  panelClassName,
  toggleColumnsPanel,
  skipLeafNames = DEFAULT_SKIP_LEAF_NAMES,
  title,
  renderLabel,
  diffSection,
  treeSubtitle,
  topSlot,
  t,
}) => {
  const [localColumns, setLocalColumns] = useState(columns);
  const localColumnsRef = useRef(localColumns);
  const onColumnsChangeRef = useRef(onColumnsChange);
  onColumnsChangeRef.current = onColumnsChange;

  useEffect(() => {
    setLocalColumns(columns);
    localColumnsRef.current = columns;
  }, [columns]);

  // Only updates local state during hover — no parent callback, no setGridOption.
  // Keeping parent silent during drag prevents ag-grid DOM mutations that disrupt HTML5 DnD.
  const onMove = useCallback((dragId: string, targetId: string) => {
    const cols = localColumnsRef.current;
    const fromIndex = cols.findIndex((col, i) => getColId(col, i) === dragId);
    const toIndex = cols.findIndex((col, i) => getColId(col, i) === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    const newCols = [...cols];
    const [removed] = newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, removed);
    localColumnsRef.current = newCols;
    setLocalColumns(newCols);
  }, []);

  // Called once on drag end — commits the final order to parent.
  const onCommit = useCallback(() => {
    onColumnsChangeRef.current(localColumnsRef.current);
  }, []);

  const listRef = useRef<HTMLUListElement>(null);
  const [, drop] = useDrop(() => ({ accept: DRAG_TYPE }));
  drop(listRef);

  const panelTitle = title ?? t(ButtonsI18nKey.Columns);

  return (
    <div className={panelClassName} onClick={(e) => e.stopPropagation()} role="toolbar" aria-label={panelTitle}>
      <div className="flex flex-row justify-between py-4 px-6 items-center h-[70px] border-b border-tertiary">
        <h3 className="flex-1 min-w-0 mr-3">{panelTitle}</h3>
        {toggleColumnsPanel && <CloseButton onClose={toggleColumnsPanel} />}
      </div>
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {topSlot}
        {diffSection && <TreeColumnsPanelDiffSwitches {...diffSection} />}
        {treeSubtitle && <h3 className="dial-tiny-text text-secondary mb-4">{treeSubtitle}</h3>}
        <ul ref={listRef} className="flex flex-col gap-4">
          {localColumns.map((col, i) => (
            <li key={getColId(col, i)}>
              <DraggableTreeItem id={getColId(col, i)} onMove={onMove} onCommit={onCommit}>
                <TreeColumnNode
                  node={col}
                  path={[i]}
                  tree={localColumns}
                  onColumnsChange={onColumnsChange}
                  skipLeafNames={skipLeafNames}
                  renderLabel={renderLabel}
                />
              </DraggableTreeItem>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const TreeColumnsPanel: FC<Props> = (props) => {
  const t = useI18n();
  return (
    <DndProvider backend={HTML5Backend}>
      <TreeColumnsPanelInner {...props} t={t} />
    </DndProvider>
  );
};

export default TreeColumnsPanel;
