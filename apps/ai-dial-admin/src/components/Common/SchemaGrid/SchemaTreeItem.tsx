'use client';

import { FC, useCallback } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';
import { IconArrowRight, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { SchemaTreeNode } from './utils';

export interface SchemaTreeSelectResult {
  expression: string;
  type: string;
}

interface TreeItemProps {
  node: SchemaTreeNode;
  depth: number;
  expandedSet: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelect: (result: SchemaTreeSelectResult) => void;
}

const SchemaTreeItem: FC<TreeItemProps> = ({ node, depth, expandedSet, onToggleExpand, onSelect }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSet.has(node.path);

  const toggleExpand = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(node.path);
    }
  }, [hasChildren, node.path, onToggleExpand]);

  const handleSelect = useCallback(() => {
    onSelect({ expression: node.path, type: node.type.toUpperCase() });
  }, [node.path, node.type, onSelect]);

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-row gap-x-2 mb-1 items-center rounded hover:bg-layer-2 group"
        style={{ paddingLeft: depth * 20 }}
      >
        <div
          className={classNames(
            'flex items-center justify-center w-[18px] h-[18px] shrink-0 rounded',
            hasChildren && 'cursor-pointer hover:bg-layer-3',
          )}
          onClick={toggleExpand}
        >
          {hasChildren &&
            (isExpanded ? (
              <IconChevronDown size={14} className="text-secondary" />
            ) : (
              <IconChevronRight size={14} className="text-secondary" />
            ))}
        </div>
        <span className="flex-1 min-w-0 small truncate">{node.name}</span>
        <DialTag label={node.type} />
        <button
          type="button"
          onClick={handleSelect}
          className="shrink-0 p-1 rounded text-tertiary hover:text-primary hover:bg-layer-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IconArrowRight size={14} stroke={2} />
        </button>
      </div>
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <SchemaTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            expandedSet={expandedSet}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
};

export default SchemaTreeItem;
