'use client';

import { DialCheckbox } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { FC, ReactNode, useState } from 'react';

import { getGroupCheckState, toggleColDefNode } from './utils';

interface Props {
  node: ColDef;
  path: number[];
  tree: ColDef[];
  onColumnsChange: (columns: ColDef[]) => void;
  skipLeafNames: string[];
  renderLabel?: (node: ColDef, displayLabel: string) => ReactNode;
}

const TreeColumnNode: FC<Props> = ({ node, path, tree, onColumnsChange, skipLeafNames, renderLabel }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const children = 'children' in node && node.children ? (node.children as ColDef[]) : [];
  const isGroup = children.length > 0;
  const nodeId = `tree_node_${path.join('_')}`;
  const ctx = node.context as { panelName?: string } | undefined;
  const displayLabel = ctx?.panelName || node.headerName?.trim();
  const panelLabel = displayLabel ? (renderLabel?.(node, displayLabel) ?? displayLabel) : null;

  if (!displayLabel) return null;

  if (!isGroup) {
    if (node.headerName && skipLeafNames.includes(node.headerName)) return null;

    return (
      <div className="pl-6">
        <DialCheckbox
          id={nodeId}
          label={panelLabel}
          checked={node.hide !== true}
          onChange={(value) => {
            onColumnsChange(toggleColDefNode(tree, path, !value));
          }}
        />
      </div>
    );
  }

  const checkState = getGroupCheckState(node, skipLeafNames);

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          className="flex items-center justify-center w-5 h-5 shrink-0 text-secondary hover:text-primary"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </button>
        <DialCheckbox
          id={nodeId}
          label={panelLabel}
          checked={checkState === 'checked'}
          indeterminate={checkState === 'indeterminate'}
          onChange={(value) => {
            onColumnsChange(toggleColDefNode(tree, path, !value));
          }}
        />
      </div>
      {isExpanded && (
        <ul className="flex flex-col gap-2 mt-2 pl-6">
          {children.map((child, i) => (
            <li key={i}>
              <TreeColumnNode
                node={child}
                path={[...path, i]}
                tree={tree}
                onColumnsChange={onColumnsChange}
                skipLeafNames={skipLeafNames}
                renderLabel={renderLabel}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TreeColumnNode;
