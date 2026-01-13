'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import {
  DialCloseButton,
  DialLoader,
  DialPrimaryButton,
  DialSelect,
  SelectOption,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';
import { RJSFSchema } from '@rjsf/utils';

import { tryOutTool } from '@/src/app/[lang]/toolsets/actions';
import Divider from '@/src/components/Common/Divider/Divider';
import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  CompareI18nKey,
  EntitiesI18nKey,
  ToolsetI18nKey,
  TypeI18nKey,
} from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { Tool } from '@/src/models/dial/toolset';
import { ParamsView } from '@/src/types/parameters';
import { tryOutAssetTool } from '@/src/app/[lang]/assets-toolsets/actions';

interface Props {
  tool?: Tool;
  toolSetName: string;
  isAssetToolset?: boolean;
}

const TryOut: FC<Props> = ({ tool, toolSetName, isAssetToolset }) => {
  const t = useI18n();
  const { closeSidebar } = useAppContext().sidebar;

  const [responseView, setResponseView] = useState(ParamsView.FORM);
  const [requestBody, setRequestBody] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<string>('');

  const [isRequestSend, setIsRequestSend] = useState(false);

  const items: SelectOption[] = useMemo(() => {
    return [
      {
        value: ParamsView.FORM,
        label: t(EntitiesI18nKey[ParamsView.FORM]),
      },
      {
        value: ParamsView.JSON,
        label: t(TypeI18nKey[ParamsView.JSON]),
      },
    ];
  }, [t]);

  const sendRequest = useCallback(() => {
    setIsRequestSend(true);
    (isAssetToolset
      ? tryOutAssetTool({
          toolSetPath: {
            path: toolSetName,
          },
          callToolRequest: {
            name: tool?.name,
            arguments: requestBody,
          },
        })
      : tryOutTool(toolSetName, { name: tool?.name, arguments: requestBody })
    ).then((res) => {
      setResponse(JSON.stringify((res.success ? res.response : { error: res.errorMessage }) || {}, null, 2));
      setIsRequestSend(false);
    });
  }, [isAssetToolset, requestBody, tool?.name, toolSetName]);

  const onChangeConfiguration = useCallback((config: Record<string, unknown>) => {
    setRequestBody(config);
  }, []);

  return (
    <div className="flex flex-col gap-y-8 w-[800px] h-full min-h-0">
      <div className="flex items-center justify-between">
        <h1 className="text-primary overflow-ellipsis">{t(ToolsetI18nKey.TryOut)}</h1>
        <div className="flex flex-row items-center gap-x-4">
          <DialPrimaryButton
            label={t(ButtonsI18nKey.SendRequest)}
            onClick={() => sendRequest()}
            disabled={responseView !== ParamsView.FORM || isRequestSend}
          />
          <DialCloseButton onClose={closeSidebar} />
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex flex-row items-center justify-between mb-4">
            <h3>{t(BasicI18nKey.Request)}</h3>
            <DialSelect
              prefix={`${t(CompareI18nKey.View)}: `}
              size={SelectSize.Sm}
              variant={SelectVariant.Secondary}
              options={items}
              value={responseView}
              onChange={(v) => setResponseView(v as ParamsView)}
            />
          </div>
          <div className="flex-1 basis-0 min-h-0 overflow-y-auto flex flex-col">
            {responseView === ParamsView.FORM ? (
              <SchemaUiRenderer
                schema={{ ...(tool?.inputSchema as RJSFSchema), isRoot: true }}
                onChangeConfiguration={onChangeConfiguration}
                onGetSchemeDefaults={onChangeConfiguration}
                data={requestBody}
              />
            ) : (
              <JsonEditor entity={tool?.inputSchema?.properties as Record<string, unknown>} readonly={true} />
            )}
          </div>
        </div>
        <Divider />
        <div className="flex-1 basis-0 min-h-0 flex flex-col">
          <h3 className="mb-4">{t(BasicI18nKey.Response)}</h3>
          {isRequestSend ? (
            <DialLoader />
          ) : (
            <div className="flex flex-1 border border-primary rounded p-2 overflow-y-auto whitespace-pre">
              {response}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOut;
