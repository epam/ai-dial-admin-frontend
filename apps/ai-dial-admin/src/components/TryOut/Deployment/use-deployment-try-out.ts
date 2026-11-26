import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTryOutInterfaces } from '@/src/app/actions/try-out';
import { sendDeploymentTryOut } from '@/src/components/TryOut/Deployment/send-try-out-request';
import { TryOutFailure, TryOutFailureKind, TryOutMode, TryOutStatus } from '@/src/components/TryOut/Deployment/models';
import { buildTryOutBody } from '@/src/components/TryOut/Deployment/utils/build-request-body';
import { classifyTryOutFailure } from '@/src/components/TryOut/Deployment/utils/classify-failure';
import { extractStreamText } from '@/src/components/TryOut/Deployment/utils/extract-stream-text';
import { getSupportedTryOutInterfaces } from '@/src/components/TryOut/Deployment/utils/get-supported-interfaces';
import { parseBodyText, toTryOutRequest } from '@/src/components/TryOut/Deployment/utils/to-try-out-request';
import { TryOutResponseData } from '@/src/components/TryOut/models';
import { createSseParser, SseEvent } from '@/src/components/TryOut/utils/sse-parser';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  try {
    return text === '' ? undefined : JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * State and actions behind the Deployment Try out panel. Simple and Advanced mode are two views of one request:
 * the body is built from the message until it is edited, and from then on the edited text is sent. Changing the
 * message or the interface, or resetting, builds it again.
 */
export const useDeploymentTryOut = (deployment: string) => {
  const [mode, setMode] = useState(TryOutMode.Simple);
  const [reportedInterfaces, setReportedInterfaces] = useState<string[] | null>(null);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState(true);
  const [selectedType, setSelectedType] = useState<DeploymentInterfaceType | null>(null);
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState<TestSuiteRequestTemplate>({ headers: [], queryParams: [] });
  const [editedBody, setEditedBody] = useState<string | null>(null);

  const [status, setStatus] = useState(TryOutStatus.Idle);
  const [failure, setFailure] = useState<TryOutFailure | null>(null);
  const [response, setResponse] = useState<TryOutResponseData | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [traceUrl, setTraceUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingInterfaces(true);
    getTryOutInterfaces(deployment)
      .then((reported) => isCurrent && setReportedInterfaces(reported))
      .catch(() => isCurrent && setReportedInterfaces(null))
      .finally(() => isCurrent && setIsLoadingInterfaces(false));

    return () => {
      isCurrent = false;
    };
  }, [deployment]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const supportedTypes = useMemo(() => getSupportedTryOutInterfaces(reportedInterfaces), [reportedInterfaces]);
  const type =
    selectedType != null && supportedTypes.includes(selectedType) ? selectedType : (supportedTypes[0] ?? null);

  const builtBody = useMemo(
    () => (type ? JSON.stringify(buildTryOutBody(type, deployment, message), null, 2) : ''),
    [type, deployment, message],
  );
  const bodyText = editedBody ?? builtBody;
  const isBodyValid = parseBodyText(bodyText).isValid;
  const isSending = status === TryOutStatus.Sending;
  const hasInput = mode === TryOutMode.Simple ? message.trim() !== '' : bodyText.trim() !== '';
  const canSend = type != null && !isLoadingInterfaces && !isSending && hasInput && isBodyValid;

  const onChangeType = useCallback((next: DeploymentInterfaceType) => {
    setSelectedType(next);
    setEditedBody(null);
  }, []);

  const onChangeMessage = useCallback((next: string) => {
    setMessage(next);
    setEditedBody(null);
  }, []);

  const onReset = useCallback(() => setEditedBody(null), []);

  const readStream = useCallback(async (streamResponse: Response) => {
    const reader = streamResponse.body?.getReader();
    if (!reader) {
      return;
    }
    const decoder = new TextDecoder();
    const parser = createSseParser();
    const events: SseEvent[] = [];
    const publish = () =>
      setResponse({ streaming: true, events: [...events], body: extractStreamText(events) || void 0 });

    for (;;) {
      const { done, value } = await reader.read();
      const incoming = done ? parser.flush() : parser.push(decoder.decode(value, { stream: true }));
      if (incoming.length > 0) {
        events.push(...incoming);
        publish();
      }
      if (done) {
        return;
      }
    }
  }, []);

  const onSend = useCallback(async () => {
    const request =
      type &&
      toTryOutRequest({ type, deployment, headers: template.headers, queryParams: template.queryParams, bodyText });
    if (!request || !type) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus(TryOutStatus.Sending);
    setFailure(null);
    setResponse(null);
    setResponseStatus(null);
    setTraceUrl(null);

    try {
      const result = await sendDeploymentTryOut(request, controller.signal);
      setResponseStatus(result.status);
      setTraceUrl(result.traceUrl ?? null);

      if (!result.response.ok) {
        setResponse({ body: await readJson(result.response) });
        setFailure(classifyTryOutFailure(result.status, result.isProxyError));
        setStatus(TryOutStatus.Failed);
        return;
      }
      if (result.isEventStream) {
        setResponse({ streaming: true, events: [] });
        await readStream(result.response);
      } else {
        setResponse({ body: await readJson(result.response) });
      }
      setStatus(TryOutStatus.Done);
    } catch (error) {
      if (isAbort(error)) {
        setStatus(TryOutStatus.Idle);
        return;
      }
      setFailure({ kind: TryOutFailureKind.Network });
      setStatus(TryOutStatus.Failed);
    }
  }, [bodyText, deployment, readStream, template.headers, template.queryParams, type]);

  const onStop = useCallback(() => abortRef.current?.abort(), []);

  return {
    mode,
    setMode,
    supportedTypes,
    type,
    isLoadingInterfaces,
    isInterfacesUnknown: !isLoadingInterfaces && reportedInterfaces == null,
    message,
    template,
    setTemplate,
    bodyText,
    isBodyValid,
    canSend,
    status,
    failure,
    response,
    responseStatus,
    traceUrl,
    onChangeType,
    onChangeMessage,
    onChangeBody: setEditedBody,
    onReset,
    onSend,
    onStop,
  };
};
