'use client';

import { FC, useCallback } from 'react';

import { IconButton, DialTag, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { SchemaTreeSelectResult } from '@/src/components/Common/SchemaGrid/models';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SchemaTreeNode } from './utils';

interface TreeItemProps {
  node: SchemaTreeNode;
  depth: number;
  expandedSet: Set<string>;
  selectedPath?: string;
  onToggleExpand: (path: string) => void;
  onSelect: (result: SchemaTreeSelectResult) => void;
}

const SchemaTreeItem: FC<TreeItemProps> = ({ node, depth, expandedSet, selectedPath, onToggleExpand, onSelect }) => {
  const t = useI18n();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSet.has(node.path);
  const isSelected = selectedPath === node.path;

  const onToggleNode = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(node.path);
    }
  }, [hasChildren, node.path, onToggleExpand]);

  const onSelectNode = useCallback(() => {
    onToggleNode();
    onSelect({ expression: node.path, type: node.type.toUpperCase() });
  }, [node.path, node.type, onSelect, onToggleNode]);

  return (
    <div className="flex flex-col">
      <div
        className={classNames(
          'flex flex-row items-center gap-x-2 py-1 pr-2 rounded hover:bg-accent-primary-alpha',
          isSelected && 'bg-accent-primary-alpha',
        )}
        style={{ paddingLeft: 4 + depth * 24 }}
      >
        {hasChildren ? (
          <IconButton
            className="flex items-center justify-center rounded text-secondary hover:bg-accent-primary-alpha hover:text-accent-primary cursor-pointer"
            onClick={onToggleNode}
            size={ElementSize.Small}
            aria-label={t(isExpanded ? JsonAtaI18nKey.CollapseField : JsonAtaI18nKey.ExpandField, { name: node.name })}
            aria-expanded={isExpanded}
            icon={isExpanded ? <IconChevronDown size={16} aria-hidden /> : <IconChevronRight size={16} aria-hidden />}
          />
        ) : (
          <div className="w-[24px] h-[24px] shrink-0" />
        )}
        <button
          type="button"
          className="flex-1 min-w-0 flex justify-between items-center gap-x-2 text-left cursor-pointer"
          aria-current={isSelected || undefined}
          onClick={onSelectNode}
        >
          <span className="flex-1 min-w-0 dial-small-text truncate">{node.name}</span>
          <DialTag label={node.type} className="rounded" />
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
            selectedPath={selectedPath}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
};

export default SchemaTreeItem;
