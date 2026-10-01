'use client';

import { FC, useCallback } from 'react';

import { DialIconButton, DialTag, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

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
    toggleExpand();
    onSelect({ expression: node.path, type: node.type.toUpperCase() });
  }, [node.path, node.type, onSelect, toggleExpand]);

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-row items-center gap-x-2 py-1 pr-1 rounded hover:bg-accent-primary-alpha group"
        style={{ paddingLeft: depth ? depth * 20 : 4 }}
      >
        {hasChildren ? (
          <DialIconButton
            className="flex items-center justify-center rounded text-secondary hover:bg-accent-primary-alpha hover:text-accent-primary cursor-pointer"
            onClick={toggleExpand}
            size={ElementSize.Small}
            icon={isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          />
        ) : (
          <div className="w-[24px] h-[24px]" />
        )}
        <div className="flex-1 min-w-0 flex justify-between items-center truncate" onClick={handleSelect}>
          <span className="flex-1 min-w-0 small truncate">{node.name}</span>
          <DialTag label={node.type} className="rounded" />
        </div>
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
