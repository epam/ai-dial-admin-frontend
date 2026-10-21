'use client';

import { FC, useCallback, useId, useState } from 'react';

import { DialIconButton, DialLabel, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import { JSONSchema7 } from 'json-schema';
import classNames from 'classnames';

import SchemaTree from '@/src/components/Common/SchemaGrid/SchemaTree';
import { SchemaTreeSelectResult } from '@/src/components/Common/SchemaGrid/models';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  responseSchema: JSONSchema7;
  onSelect: (result: SchemaTreeSelectResult) => void;
}

const boxClassName = 'flex flex-col flex-1 min-h-0 rounded-lg bg-layer-2 divide-y divide-tertiary';
const footerClassName = 'flex shrink-0 h-12 items-center px-2';

// The tree stays mounted while collapsed so its expansion and selection survive; `inert` takes it out of
// the tab order and the accessibility tree.
const ReferenceFieldsPanel: FC<Props> = ({ responseSchema, onSelect }) => {
  const t = useI18n();
  const treeRegionId = useId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const label = t(JsonAtaI18nKey.ReferenceFields);

  const onToggleCollapsed = useCallback(() => setIsCollapsed((isCurrentlyCollapsed) => !isCurrentlyCollapsed), []);

  return (
    <div className={classNames('flex flex-col min-h-0', isCollapsed ? 'w-10 shrink-0' : 'flex-1 basis-0 min-w-0')}>
      <div
        id={treeRegionId}
        inert={isCollapsed}
        className={classNames('flex-1 min-h-0 gap-y-1', isCollapsed ? 'hidden' : 'flex flex-col')}
      >
        <DialLabel label={label} />
        <div className={boxClassName}>
          <div className="flex flex-col flex-1 min-h-0 p-4">
            <SchemaTree responseSchema={responseSchema} onSelect={onSelect} />
          </div>
          <div className={classNames(footerClassName, 'justify-end')}>
            <DialIconButton
              className="text-secondary hover:text-accent-primary cursor-pointer"
              size={ElementSize.Small}
              aria-label={t(JsonAtaI18nKey.CollapseReferenceFields)}
              aria-expanded
              aria-controls={treeRegionId}
              icon={<IconChevronsLeft size={20} aria-hidden />}
              onClick={onToggleCollapsed}
            />
          </div>
        </div>
      </div>
      {isCollapsed && (
        <div className={boxClassName}>
          <span className="flex-1 min-h-0 pt-6 text-center small text-secondary [writing-mode:vertical-rl] rotate-180 self-center">
            {label}
          </span>
          <div className={classNames(footerClassName, 'justify-center')}>
            <DialIconButton
              className="text-secondary hover:text-accent-primary cursor-pointer"
              size={ElementSize.Small}
              aria-label={t(JsonAtaI18nKey.ExpandReferenceFields)}
              aria-expanded={false}
              aria-controls={treeRegionId}
              icon={<IconChevronsRight size={20} aria-hidden />}
              onClick={onToggleCollapsed}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceFieldsPanel;
