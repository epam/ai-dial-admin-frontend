'use client';
import { FC, useMemo } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { toTryOutJsonEditorProps } from '@/src/components/TestSuites/utils/tryout-json-editor';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  streaming?: boolean;
  events?: unknown[];
  isLoading?: boolean;
}

const EMPTY_EVENTS: unknown[] = [];

const TryOutEventsSection: FC<Props> = ({ streaming, events, isLoading }) => {
  const t = useI18n();
  const eventsValue = events ?? EMPTY_EVENTS;
  const copyText = useMemo(() => JSON.stringify(eventsValue, null, 2), [eventsValue]);
  const editorProps = useMemo(() => toTryOutJsonEditorProps(eventsValue, { wordWrap: 'off' }), [eventsValue]);

  if (streaming !== true) {
    return null;
  }

  const title = t(TabsI18nKey.Events);

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={false}
      fullViewContent={copyText}
      headerIcon={<CopyButton value={copyText} valueLabel={title} />}
      growOnOpen={false}
    >
      {isLoading ? (
        <Spinner size={18} fullWidth />
      ) : (
        <div className="h-64 min-h-64">
          <JsonEditor
            entity={editorProps.entity}
            text={editorProps.text}
            options={editorProps.options}
            readonly={true}
          />
        </div>
      )}
    </CollapsibleSection>
  );
};

export default TryOutEventsSection;
