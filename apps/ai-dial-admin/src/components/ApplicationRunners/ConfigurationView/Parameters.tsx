import { FC, useEffect, useState } from 'react';

import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { clearSchemeForEditor } from './utils';

interface Props {
  scheme: DialApplicationScheme;
  onChangeScheme: (scheme: DialApplicationScheme) => void;
}

const SchemeParameters: FC<Props> = ({ scheme, onChangeScheme }) => {
  const t = useI18n();

  const [editorScheme, setEditorScheme] = useState<DialApplicationScheme>(clearSchemeForEditor(scheme));

  useEffect(() => {
    onChangeScheme({ ...scheme, ...editorScheme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorScheme]);

  return (
    <div className="flex flex-col h-full w-full mt-3">
      <div className="flex flex-col flex-1 min-h-0 mt-3 w-full">
        <h1 className="mb-3">{t(CreateI18nKey.SchemeTitle)}</h1>

        <JSONEditor key={0} model={editorScheme} setSelectedEntity={setEditorScheme} errorNotifications={[]} />
      </div>
    </div>
  );
};

export default SchemeParameters;
