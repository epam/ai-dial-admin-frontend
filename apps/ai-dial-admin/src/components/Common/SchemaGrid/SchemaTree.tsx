'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import SchemaTreeItem from './SchemaTreeItem';
import { schemaToTreeNodes } from './utils';

export interface SchemaTreeSelectResult {
  expression: string;
  type: string;
}

interface SchemaTreeProps {
  responseSchema: JSONSchema7;
  onSelect: (result: SchemaTreeSelectResult) => void;
}

const SchemaTree: FC<SchemaTreeProps> = ({ responseSchema, onSelect }) => {
  const t = useI18n();
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => new Set());

  const toggleExpand = useCallback((path: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const nodes = useMemo(() => {
    if (!responseSchema || responseSchema.type !== 'object') return [];
    return schemaToTreeNodes(responseSchema, '');
  }, [responseSchema]);

  if (nodes.length === 0) {
    return <DialNoDataContent title={t(TestSuitesI18nKey.NoSchemaProperties)} />;
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {nodes.map((node) => (
        <SchemaTreeItem
          key={node.path}
          node={node}
          depth={0}
          expandedSet={expandedSet}
          onToggleExpand={toggleExpand}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default SchemaTree;
