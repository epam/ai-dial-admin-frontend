'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

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

import { tryOutAssetTool } from '@/src/app/[lang]/assets-toolsets/actions';
import { tryOutTool } from '@/src/app/[lang]/toolsets/actions';
import Divider from '@/src/components/Common/Divider/Divider';
import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
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

interface Props {
  tool?: Tool;
  toolSetName: string;
  isAssetToolset?: boolean;
}

const TryOut: FC<Props> = ({ tool, toolSetName, isAssetToolset }) => {
  const t = useI18n();
  const { sidebar, toggleSidebar } = useAppContext();

  const [responseView, setResponseView] = useState(ParamsView.FORM);
  const [requestBody, setRequestBody] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<Record<string, unknown>>({});

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

  const isEmptyRequest = useMemo(() => {
    return (
      !tool?.inputSchema ||
      (tool?.inputSchema && (!tool?.inputSchema.properties || Object.keys(tool?.inputSchema.properties).length === 0))
    );
  }, [tool?.inputSchema]);

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
      setResponse(res.success ? res.response : { error: res.errorMessage });
      setIsRequestSend(false);
    });
  }, [isAssetToolset, requestBody, tool?.name, toolSetName]);

  const onChangeConfiguration = useCallback((config: Record<string, unknown>) => {
    setRequestBody(config);
  }, []);

  const close = useCallback(() => {
    if (sidebar.isMenuClosed) {
      toggleSidebar();
      sidebar.toggleIsMenuClosed?.();
    }
    sidebar.closeSidebar();
  }, [sidebar, toggleSidebar]);

  useEffect(() => {
    setResponse({});
    setRequestBody({});
  }, [tool?.name]);

  return (
    <div className="flex flex-col gap-y-8 w-full h-full min-h-0">
      <div className="flex items-center justify-between">
        <h1 className="text-primary overflow-ellipsis">{t(ToolsetI18nKey.TryOut)}</h1>
        <div className="flex flex-row items-center gap-x-4">
          <DialPrimaryButton
            label={t(ButtonsI18nKey.SendRequest)}
            onClick={() => sendRequest()}
            disabled={isRequestSend}
          />
          <DialCloseButton onClose={close} />
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
              disabled={isEmptyRequest}
            />
          </div>
          <div className="flex-1 basis-0 min-h-0 overflow-y-auto flex flex-col">
            {isEmptyRequest ? (
              <div className="flex-1 flex items-center justify-center">{t(EntitiesI18nKey.NoInputs)}</div>
            ) : responseView === ParamsView.FORM ? (
              <SchemaUiRenderer
                schema={{ ...(tool?.inputSchema as RJSFSchema), isRoot: true }}
                onChangeConfiguration={onChangeConfiguration}
                onGetSchemeDefaults={onChangeConfiguration}
                data={requestBody}
              />
            ) : (
              <JsonEditor entity={requestBody} options={{ stickyScroll: { enabled: false } }} />
            )}
          </div>
        </div>
        <Divider />
        <div className="flex-1 basis-0 min-h-0 flex flex-col">
          <h3 className="mb-4">{t(BasicI18nKey.Response)}</h3>
          {isRequestSend ? (
            <DialLoader />
          ) : (
            <JsonEditor entity={response} options={{ stickyScroll: { enabled: false } }} readonly={true} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOut;
