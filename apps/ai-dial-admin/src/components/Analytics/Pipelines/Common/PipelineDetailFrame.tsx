'use client';

import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ConfirmationPopup,
  ConfirmationPopupVariant,
  Tabs,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { IconAlertTriangleFilled, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { deletePipeline, updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import PipelineAudit from '@/src/components/Analytics/Pipelines/PipelineAudit';
import PipelineGroups from '@/src/components/Analytics/Pipelines/Groups/PipelineGroups';
import PipelineRuntime from '@/src/components/Analytics/Pipelines/PipelineRuntime';
import DeletePipelinePopup from '@/src/components/Analytics/Pipelines/Common/DeletePipelinePopup';
import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import PipelineReadOnlyFacts from '@/src/components/Analytics/Pipelines/Common/PipelineReadOnlyFacts';
import PipelinePauseBanner from '@/src/components/Analytics/Pipelines/Common/PipelinePauseBanner';
import PipelineRuntimeAlerts from '@/src/components/Analytics/Pipelines/Common/PipelineRuntimeAlerts';
import PipelineRuntimeBadge from '@/src/components/Analytics/Pipelines/Common/PipelineRuntimeBadge';
import PausePipelinePopup from '@/src/components/Analytics/Pipelines/Common/PausePipelinePopup';
import { isRunnerDriven } from '@/src/components/Analytics/Pipelines/Common/use-paused-pipelines';
import {
  isGenerationBehind,
  isPauseOfferedFor,
  pauseOf,
  runtimeStatusOfView,
} from '@/src/components/Analytics/Pipelines/Common/runtime-view';
import { usePipelineRuntimeView } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-runtime-view';
import { hasDeadLetters } from '@/src/components/Analytics/Pipelines/Failures/failures';
import { usePipelineFailures } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { usePipelinePause } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-pause';
import { PipelineFormState } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';
import { ServerActionResponse } from '@/src/models/server-action';
import { Pipeline, TriggerKind } from '@/src/models/analytics/pipeline';
import { PipelineRuntimeStatus } from '@/src/models/analytics/pipeline-runtime';
import { ApplicationRoute } from '@/src/types/routes';
import { auditTab, EntityViewTab, groupsTab, propertiesTab, runtimeTab } from '@/src/utils/tabs/utils';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { buildPipelineDto, toPipelineDraft } from '@/src/utils/analytics/pipeline-dto';

type PipelineFormLike = PipelineFormState & { hasFieldErrors: boolean };

interface Props {
  pipeline: Pipeline;
  form: PipelineFormLike;
  children: ReactNode;
  /** Whether the runner tracks any group for the pipeline; see the detail page for why it is decided there. */
  hasGroups?: boolean;
}

// A predicate naming a sensitive column fails with 403 rather than the 422 a bad expression gets, and the
// two have different remedies — so the heading says which happened instead of reading as a rejected
// expression.
const FORBIDDEN = 403;

// Four labels, one control: which verb it offers follows the pause, and whether it is mid-request
// follows the action. A control that still said "Pause" while pausing invites the second click.
const pauseLabelKey = (isPaused: boolean, isBusy: boolean): AnalyticsPipelinesI18nKey => {
  if (isPaused) return isBusy ? AnalyticsPipelinesI18nKey.Resuming : AnalyticsPipelinesI18nKey.Resume;
  return isBusy ? AnalyticsPipelinesI18nKey.Pausing : AnalyticsPipelinesI18nKey.Pause;
};

const PipelineDetailFrame: FC<Props> = ({ pipeline, form, children, hasGroups = false }) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin, featureFlags } = useAppContext();
  const { showNotification } = useNotification();
  const { dispatch, jsonErrors } = useSaveValidationContext();

  const { draft, reset, buildDto, target } = form;

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglePromptOpen, setIsTogglePromptOpen] = useState(false);
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [documentSeed, setDocumentSeed] = useState<Pipeline | PipelineDraft | null>(null);
  const [activeTab, setActiveTab] = useState<EntityViewTab>(EntityViewTab.Properties);

  // The runner is a second upstream, read only for a caller who can act on it: it authorizes every one
  // of its endpoints on full-admin rights, so for anyone else there is nothing to present read-only.
  //
  // One read, not two. The pipeline's own runtime view states its state and carries the pause it is
  // under, where the page used to look itself up in two global listings — which the listing page still
  // reads, because it asks the same question about every row at once.
  const isRunnerRead = isRunnerDriven(pipeline.kind) && !!featureFlags.analyticsEnabled;
  const runtime = usePipelineRuntimeView(pipeline.name, isRunnerRead);
  const pause = usePipelinePause(pipeline.name, runtime.reload);

  // Read by the frame rather than by the tab, because the tab label carries the count: a reader on
  // `Properties` has to see that there is something to act on without opening `Runtime` first.
  //
  // Only where there is something to read. A SQL enrichment and an aggregate are all-or-nothing, so
  // they dead-letter nothing; and with analytics off neither the tab strip nor the Runtime tab is
  // rendered at all, so the request would be answered into a surface nobody can open.
  const canDeadLetter = hasDeadLetters(pipeline.kind, pipeline.transform?.type);
  const failures = usePipelineFailures(pipeline.name, canDeadLetter && !!featureFlags.analyticsEnabled);
  const failureCount = failures.counts.total;

  const pausedEntry = pauseOf(runtime.view?.status);
  const runtimeStatus = runtimeStatusOfView(runtime, pipeline.enabled, pipeline.kind);
  // Not the same question as what the chip states, and deliberately so: a read that did not land
  // leaves nothing to state while the pipeline is still running, and that is exactly when an operator
  // reaches for the stop. See `isPauseOfferedFor`.
  const isPauseOffered = isPauseOfferedFor(runtime, pipeline.enabled, pipeline.kind);
  const isBehind = isGenerationBehind(runtime.view, pipeline.generation);

  // A mark rather than a number. The kit's count badge is drawn in the accent, which reads as a
  // quantity worth noticing rather than as something broken, and it carries no hook to re-colour: its
  // span has only utility classes, so tinting it would mean a positional selector into the kit's own
  // markup. Severity is what this badge is for; how many have failed is one click away.
  //
  // The kit wraps a tab's icon in an `aria-hidden` span, so the mark is decorative by construction
  // whatever is put on it. The count is therefore stated in text beside the strip — see the status
  // line below — because a fault signalled by colour alone is signalled to nobody.
  const tabs = useMemo(() => {
    if (!isFullAdmin) return [propertiesTab(t), auditTab(t)];

    const runtime = failureCount
      ? {
          ...runtimeTab(t),
          icon: <IconAlertTriangleFilled {...BASE_BUTTON_ICON_PROPS} className="text-error" />,
        }
      : runtimeTab(t);

    return hasGroups
      ? [propertiesTab(t), runtime, groupsTab(t), auditTab(t)]
      : [propertiesTab(t), runtime, auditTab(t)];
  }, [t, isFullAdmin, failureCount, hasGroups]);

  const assemblyContext = useMemo(
    () => ({ grainKey: form.grainKey, sourceTable: target?.source_table }),
    [form.grainKey, target?.source_table],
  );

  const storedDocument = useMemo(
    () => buildPipelineDto(toPipelineDraft(pipeline), assemblyContext),
    [pipeline, assemblyContext],
  );

  const draftDocument = useMemo(() => buildPipelineDto(draft, assemblyContext), [draft, assemblyContext]);

  const isChanged = !isEqualSkippingUndefined(draftDocument, storedDocument);

  const shouldCheckFields = !isEditorEnabled;
  // The save is barred only when there is nothing to send as `group_by`. The target's grain key is the
  // default, not the requirement: where the read source reaches that key through an enrichment, the value
  // is the qualified spelling the author chose, and a target the page could not resolve must not withhold
  // a save from a declaration that already carries one.
  const isGroupKeyMissing =
    draft.trigger?.kind === TriggerKind.Group && !draft.trigger?.group_by?.trim() && !form.grainKey;

  const hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length);
  const isChangeBarShown = isFullAdmin && (isChanged || hasJsonErrors);

  // The document is what the service holds, not what a save would send: every member of the response is
  // shown, the resolved ones included. What may be sent back is decided on save, by `buildDto`, which
  // drops the read-only members — so nothing here is hidden to keep a request valid.
  useEffect(() => {
    reset(pipeline);
    setDocumentSeed((seed) => (seed ? pipeline : seed));
  }, [pipeline, reset]);

  // Both upstreams at once. The page's own refresh brings a fresh `state` with the pipeline; the
  // runner is a separate read this frame owns, and `router.refresh()` does not re-run its effect.
  const onReloadRuntime = useCallback(() => {
    router.refresh();
    void runtime.reload();
    void failures.reload();
  }, [router, runtime, failures]);

  const onDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    reset(pipeline);
    setDocumentSeed(pipeline);
  }, [dispatch, pipeline, reset]);

  const onToggleEditor = useCallback(() => {
    // Entering the editor is barred while anything is unsaved, so the stored object is also the draft.
    if (!isEditorEnabled) setDocumentSeed(pipeline);
    // The strip is withdrawn with the rest of the body while the document is on screen, so leaving
    // the editor has to bring it back on Properties rather than on whatever was selected before.
    setActiveTab(EntityViewTab.Properties);
    setIsEditorEnabled((prev) => !prev);
  }, [isEditorEnabled, pipeline]);

  const saveFailureHeader = useCallback(
    (res: ServerActionResponse) =>
      res.status === FORBIDDEN
        ? t(AnalyticsPipelinesI18nKey.SaveForbidden)
        : (res.errorHeader ?? t(AnalyticsPipelinesI18nKey.SaveFailed)),
    [t],
  );

  const onSave = useCallback(async () => {
    if ((shouldCheckFields && form.hasFieldErrors) || isGroupKeyMissing || isSaving) return;

    setIsSaving(true);
    const res = await updatePipeline(pipeline.name, buildDto());
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.Saved)));
      router.refresh();
      return;
    }

    showNotification(getErrorNotification(saveFailureHeader(res), res.errorMessage, res.requestId));
  }, [
    shouldCheckFields,
    form.hasFieldErrors,
    isGroupKeyMissing,
    isSaving,
    pipeline.name,
    buildDto,
    saveFailureHeader,
    showNotification,
    t,
    router,
  ]);

  const onTryToSave = useCallback(() => {
    if (isEditorEnabled && jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
      return;
    }

    void onSave();
  }, [isEditorEnabled, jsonErrors, showNotification, t, dispatch, onSave]);

  const onToggleEnabled = useCallback(async () => {
    setIsTogglePromptOpen(false);
    setIsSaving(true);
    // Only the flag: a body carrying any declaration member re-declares the pipeline, which a running
    // aggregate one answers 409 for, and re-validates and bumps the change token for every other kind.
    const res = await updatePipeline(pipeline.name, { enabled: !pipeline.enabled });
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.EnabledChanged)));
      router.refresh();
      return;
    }

    showNotification(getErrorNotification(saveFailureHeader(res), res.errorMessage, res.requestId));
  }, [pipeline, saveFailureHeader, showNotification, t, router]);

  // The page it acted on is gone, so this returns to the listing rather than refreshing.
  const onConfirmDelete = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    const res = await deletePipeline(pipeline.name);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.Deleted)));
      router.push(ApplicationRoute.AnalyticsPipelines);
      return;
    }

    setIsSaving(false);
    setIsDeletePromptOpen(false);
    showNotification(
      getErrorNotification(
        res.errorHeader ?? t(AnalyticsPipelinesI18nKey.ActionFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  }, [isSaving, pipeline.name, showNotification, t, router]);

  const toggleLabel = t(
    pipeline.enabled ? AnalyticsPipelinesI18nKey.DisablePipeline : AnalyticsPipelinesI18nKey.EnablePipeline,
  );

  const pauseControlLabel = pauseLabelKey(Boolean(pausedEntry), pause.isBusy);

  const toggleProps = {
    label: toggleLabel,
    disabled: isChanged || isSaving,
    title: isChanged ? t(AnalyticsPipelinesI18nKey.ToggleBlockedByEdits) : undefined,
    onClick: () => setIsTogglePromptOpen(true),
  };

  // Disabling stops a pipeline; deleting destroys it. Only the second is destructive, so only the second
  // is drawn in danger — two red buttons side by side said they were the same weight.
  const enabledToggle = (
    <Button variant={pipeline.enabled ? ButtonVariant.Neutral : ButtonVariant.Primary} {...toggleProps} />
  );

  // One fallback for both conditions: with analytics disabled, or while the JSON editor holds the
  // view, the Properties body is everything below the identity row — no strip, and no Audit tab to
  // issue an analytics activity request from. There is no pipeline-status condition: `enabled` is a
  // runtime toggle, and gating on it would hide the history of the toggle itself.
  const isTabStripShown = !!featureFlags.analyticsEnabled && !isEditorEnabled;
  const isAuditShown = isTabStripShown && activeTab === EntityViewTab.Audit;
  const isRuntimeShown = isTabStripShown && isFullAdmin && activeTab === EntityViewTab.Runtime;
  const isGroupsShown = isTabStripShown && isFullAdmin && hasGroups && activeTab === EntityViewTab.Groups;

  const properties = (
    <>
      <PipelineReadOnlyFacts pipeline={pipeline} grainKey={form.grainKey} />
      <div className="flex flex-col gap-y-6 pt-6">{children}</div>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* Two axes, not one: `enabled` is the declaration and the runtime chip is what the runner is
              doing with it, so a paused pipeline still reads as enabled. */}
          {!isEditorEnabled && (
            <div className="flex flex-row items-center gap-2">
              <PipelineEnabledBadge enabled={pipeline.enabled} />
              <PipelineRuntimeBadge status={runtimeStatus} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-primary dial-h4">{pipeline.name}</h1>
            <CopyButton value={pipeline.name} valueLabel={t(AnalyticsPipelinesI18nKey.Name)} />
          </div>
        </div>

        <div className="flex min-h-10 flex-row items-center gap-3">
          {/* The page's standing actions step aside for the change bar: neither can be used while edits
              are pending, and four buttons in a row read as a choice between them. They keep their space
              while they do — removed from the flow, they dragged the JSON toggle left and back on every
              keystroke that raised or cleared the bar. `inert` rather than `aria-hidden`, so nothing
              focusable stays reachable behind the hidden row. */}
          {isFullAdmin && !isEditorEnabled && (
            <div
              className={classNames('flex flex-row items-center gap-3', isChangeBarShown && 'invisible')}
              inert={isChangeBarShown}
            >
              <Button
                variant={ButtonVariant.Danger}
                appearance={ButtonAppearance.Outlined}
                label={t(AnalyticsPipelinesI18nKey.DeletePipeline)}
                onClick={() => setIsDeletePromptOpen(true)}
              />
              {enabledToggle}
            </div>
          )}
          {/* After the actions, so it lands where they were rather than pushing the row left. */}
          {isChangeBarShown && (
            <ChangedEntityButtons
              isDesignSystem2
              disableSave={(shouldCheckFields && form.hasFieldErrors) || isGroupKeyMissing || isSaving}
              onDiscard={onDiscard}
              onSave={onTryToSave}
            />
          )}
          {!isChangeBarShown && (
            <JsonToggle isDesignSystem2 isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
          )}
        </div>
      </div>

      {isDeletePromptOpen && (
        <DeletePipelinePopup
          name={pipeline.name}
          kind={pipeline.kind}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setIsDeletePromptOpen(false)}
        />
      )}

      {pause.isConfirmOpen && (
        <PausePipelinePopup
          name={pipeline.name}
          onConfirm={() => void pause.confirmPause()}
          onClose={pause.closeConfirm}
        />
      )}

      {isTogglePromptOpen && (
        <ConfirmationPopup
          open
          variant={ConfirmationPopupVariant.Danger}
          header={t(
            pipeline.enabled
              ? AnalyticsPipelinesI18nKey.DisableConfirmTitle
              : AnalyticsPipelinesI18nKey.EnableConfirmTitle,
          )}
          description={t(
            pipeline.enabled
              ? AnalyticsPipelinesI18nKey.DisableConfirmDescription
              : AnalyticsPipelinesI18nKey.EnableConfirmDescription,
          )}
          confirmLabel={toggleLabel}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onConfirm={() => void onToggleEnabled()}
          onClose={() => setIsTogglePromptOpen(false)}
          onCancel={() => setIsTogglePromptOpen(false)}
        />
      )}

      {/* Above the strip, so a held or failing pipeline says so whichever tab is in view — and withdrawn
          with everything else below the identity row while the document is on screen. */}
      {!isEditorEnabled && pausedEntry && (
        <PipelinePauseBanner pause={pausedEntry} isResuming={pause.isBusy} onResume={() => void pause.resume()} />
      )}

      {!isEditorEnabled && <PipelineRuntimeAlerts pipeline={pipeline} />}

      {/* What the red mark on the `Runtime` tab means, for a reader who cannot see it. */}
      {isTabStripShown && failureCount > 0 && (
        <span role="status" aria-live="polite" className="sr-only">
          {t(AnalyticsPipelinesI18nKey.FailuresBadge, { count: failureCount })}
        </span>
      )}

      {isTabStripShown && (
        <Tabs
          ariaLabel={t(AnalyticsPipelinesI18nKey.Tabs)}
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={(tab) => setActiveTab(tab as EntityViewTab)}
        />
      )}

      {/* The padding, given back by the negative margin, is room for the focus outline ui-kit draws outside
          a control's border box: without it the scroll edge clipped the outline of anything touching it.
          `relative` makes this the containing block of the absolutely positioned `sr-only` inputs of
          checkboxes and radios; otherwise focusing one scrolls the `overflow-hidden` ancestor instead. */}
      <div className="relative flex-1 overflow-auto min-h-0 flex flex-col -m-1 p-1">
        {isEditorEnabled && (
          <EntityJsonEditor
            entity={documentSeed as PipelineDraft | null}
            setSelectedEntity={form.replaceDraft}
            readonly={!isFullAdmin}
          />
        )}
        {isRuntimeShown && (
          <PipelineRuntime
            pipeline={pipeline}
            runtime={runtime}
            isGenerationBehind={isBehind}
            failures={failures}
            canDeadLetter={canDeadLetter}
            isPaused={Boolean(pausedEntry)}
            isNotTracked={runtimeStatus === PipelineRuntimeStatus.NotTracked}
            onReload={onReloadRuntime}
            actions={
              isPauseOffered &&
              // Solid against the outlined Reload beside it, and each verb carries its own glyph: this
              // is the control that changes what the service is doing, the other only asks again.
              (pausedEntry ? (
                <Button
                  variant={ButtonVariant.Primary}
                  label={t(pauseControlLabel)}
                  iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  disabled={pause.isBusy}
                  onClick={() => void pause.resume()}
                />
              ) : (
                <Button
                  variant={ButtonVariant.Neutral}
                  label={t(pauseControlLabel)}
                  iconBefore={<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  disabled={pause.isBusy}
                  onClick={pause.openConfirm}
                />
              ))
            }
          />
        )}
        {isGroupsShown && (
          <PipelineGroups pipeline={pipeline} isPaused={Boolean(pausedEntry)} isGenerationBehind={isBehind} />
        )}
        {isAuditShown && (
          <div className="flex min-h-0 flex-1 flex-col">
            <PipelineAudit pipeline={pipeline} />
          </div>
        )}
        {!isEditorEnabled && !isAuditShown && !isRuntimeShown && !isGroupsShown && properties}
      </div>
    </div>
  );
};

export default PipelineDetailFrame;
