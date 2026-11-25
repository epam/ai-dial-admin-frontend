'use client';

import { FC, useMemo } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import CollapsibleSection from '@/src/components/TryOut/components/CollapsibleSection';
import TryOutEventsSection from '@/src/components/TryOut/components/TryOutEventsSection';
import { TryOutResponseData } from '@/src/components/TryOut/models';
import { toTryOutJsonEditorProps } from '@/src/components/TryOut/utils/tryout-json-editor';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  response: TryOutResponseData | null;
  isRequestSend: boolean;
  growOnOpen: boolean;
}

const TryOutResponseBody: FC<Props> = ({ response, isRequestSend, growOnOpen }) => {
  const t = useI18n();
  const copyText = useMemo(() => (response?.body != null ? JSON.stringify(response.body, null, 2) : ''), [response]);
  const editorProps = useMemo(() => toTryOutJsonEditorProps(response?.body, { wordWrap: 'off' }), [response?.body]);

  return (
    <div className="flex flex-col gap-y-4 shrink-0">
      <CollapsibleSection
        title={t(BasicI18nKey.Response)}
        fullViewContent={copyText}
        headerIcon={<CopyButton value={copyText} valueLabel={t(BasicI18nKey.Response)} />}
        growOnOpen={growOnOpen}
      >
        {isRequestSend ? (
          <div className="flex h-16 items-center justify-center overflow-hidden">
            <Spinner size={18} />
          </div>
        ) : (
          <div className={growOnOpen ? 'min-h-0 flex-1' : 'h-64 min-h-64'}>
            <JsonEditor
              entity={editorProps.entity}
              text={editorProps.text}
              options={editorProps.options}
              readonly={true}
            />
          </div>
        )}
      </CollapsibleSection>
      <TryOutEventsSection streaming={response?.streaming} events={response?.events} isLoading={isRequestSend} />
    </div>
  );
};

export default TryOutResponseBody;
