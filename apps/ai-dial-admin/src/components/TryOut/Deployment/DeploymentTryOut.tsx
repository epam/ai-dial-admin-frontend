'use client';

import { FC, useCallback, useMemo } from 'react';

import {
  ElementSize,
  OutlinedButton,
  PrimaryButton,
  Select,
  SelectOption,
  Spinner,
  Tabs,
  Textarea,
} from '@epam/ai-dial-ui-kit';

import AdvancedRequest from '@/src/components/TryOut/Deployment/components/AdvancedRequest';
import TryOutFailureMessage from '@/src/components/TryOut/Deployment/components/TryOutFailureMessage';
import TryOutLookupMessage from '@/src/components/TryOut/Deployment/components/TryOutLookupMessage';
import { TRY_OUT_INTERFACE_LABELS } from '@/src/components/TryOut/Deployment/constants';
import { TryOutLookupStatus, TryOutMode, TryOutStatus } from '@/src/components/TryOut/Deployment/models';
import { useDeploymentTryOut } from '@/src/components/TryOut/Deployment/use-deployment-try-out';
import TryOutHeader from '@/src/components/TryOut/components/TryOutHeader';
import TryOutResponseBody from '@/src/components/TryOut/components/TryOutResponseBody';
import TryOutTraceLink from '@/src/components/TryOut/components/TryOutTraceLink';
import { ButtonsI18nKey, DeploymentTryOutI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

const STATUS_MESSAGES: Partial<Record<TryOutStatus, DeploymentTryOutI18nKey>> = {
  [TryOutStatus.Sending]: DeploymentTryOutI18nKey.StatusSending,
  [TryOutStatus.Done]: DeploymentTryOutI18nKey.StatusDone,
  [TryOutStatus.Failed]: DeploymentTryOutI18nKey.StatusFailed,
};

interface Props {
  /** The deployment's id as Core names it, used in the request path and as the `model` of the request body. */
  deployment: string;
}

const DeploymentTryOut: FC<Props> = ({ deployment }) => {
  const t = useI18n();
  const tryOut = useDeploymentTryOut(deployment);
  const { mode, setMode, type, supportedTypes, lookup, status, response, failure, traceUrl } = tryOut;
  const isSending = status === TryOutStatus.Sending;

  const modeTabs = useMemo(
    () => [
      { id: TryOutMode.Simple, label: t(DeploymentTryOutI18nKey.ModeSimple) },
      { id: TryOutMode.Advanced, label: t(DeploymentTryOutI18nKey.ModeAdvanced) },
    ],
    [t],
  );
  const interfaceOptions = useMemo<SelectOption[]>(
    () =>
      supportedTypes.map((value) => ({
        value,
        label: t(TRY_OUT_INTERFACE_LABELS[value] ?? DeploymentTryOutI18nKey.InterfaceChatCompletions),
      })),
    [supportedTypes, t],
  );

  const onChangeMode = useCallback((id: string) => setMode(id as TryOutMode), [setMode]);
  const onChangeInterface = useCallback(
    (value: unknown) => tryOut.onChangeType(value as DeploymentInterfaceType),
    [tryOut],
  );

  const statusMessage = STATUS_MESSAGES[status];
  // Until the first byte arrives the spinner stands in for the response; after that the reply fills in as it streams.
  const isAwaitingResponse = isSending && (response == null || (response.events?.length ?? 0) === 0);

  return (
    <div className="flex flex-col gap-y-4 size-full min-h-0 overflow-auto pb-4">
      <TryOutHeader
        trailingActions={
          isSending ? (
            <OutlinedButton label={t(ButtonsI18nKey.Stop)} onClick={tryOut.onStop} />
          ) : (
            <PrimaryButton label={t(ButtonsI18nKey.SendRequest)} onClick={tryOut.onSend} disabled={!tryOut.canSend} />
          )
        }
      />
      <p className="text-secondary dial-small-text">{t(DeploymentTryOutI18nKey.RealRequestNote)}</p>

      {lookup.status === TryOutLookupStatus.Loading && <Spinner size={18} fullWidth />}
      <TryOutLookupMessage lookup={lookup} onRetry={tryOut.onRetryLookup} />
      {lookup.status === TryOutLookupStatus.Ready && (
        <>
          <div className="flex flex-row items-center justify-between gap-x-4">
            <Tabs
              tabs={modeTabs}
              activeTabId={mode}
              onTabChange={onChangeMode}
              ariaLabel={t(DeploymentTryOutI18nKey.Mode)}
            />
            <Select
              prefix={`${t(DeploymentTryOutI18nKey.Interface)}: `}
              ariaLabel={t(DeploymentTryOutI18nKey.Interface)}
              size={ElementSize.Small}
              options={interfaceOptions}
              value={type ?? undefined}
              onChange={onChangeInterface}
              disabled={isSending}
              className="w-auto"
            />
          </div>

          {mode === TryOutMode.Simple ? (
            <Textarea
              id="deployment-try-out-message"
              labelProps={{ label: t(DeploymentTryOutI18nKey.Message) }}
              placeholder={t(DeploymentTryOutI18nKey.MessagePlaceholder)}
              value={tryOut.message}
              onChange={tryOut.onChangeMessage}
              disabled={isSending}
              rows={4}
            />
          ) : (
            <AdvancedRequest
              template={tryOut.template}
              onChangeTemplate={tryOut.setTemplate}
              bodyText={tryOut.bodyText}
              isBodyValid={tryOut.isBodyValid}
              onChangeBody={tryOut.onChangeBody}
              onReset={tryOut.onReset}
            />
          )}
        </>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage ? t(statusMessage) : ''}
      </span>

      {failure && <TryOutFailureMessage failure={failure} />}
      <TryOutTraceLink url={traceUrl} />
      {(response || isSending) && (
        <TryOutResponseBody response={response} isRequestSend={isAwaitingResponse} growOnOpen={false} />
      )}
    </div>
  );
};

export default DeploymentTryOut;
