'use client';

import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  ButtonAppearance,
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialDangerButton,
  DialPrimaryButton,
  DialTabs,
} from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import PipelineAudit from '@/src/components/Analytics/Pipelines/PipelineAudit';
import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import PipelineReadOnlyFacts from '@/src/components/Analytics/Pipelines/Common/PipelineReadOnlyFacts';
import PipelineStateSection from '@/src/components/Analytics/Pipelines/Common/PipelineStateSection';
import { PipelineFormState } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';
import { Pipeline, TriggerKind } from '@/src/models/analytics/pipeline';
import { auditTab, EntityViewTab, propertiesTab } from '@/src/utils/tabs/utils';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { buildPipelineDto, getPipelineInput, toPipelineDraft } from '@/src/utils/analytics/pipeline-dto';

type PipelineFormLike = PipelineFormState & { isValid: boolean };

interface Props {
  pipeline: Pipeline;
  form: PipelineFormLike;
  children: ReactNode;
}

const PipelineDetailFrame: FC<Props> = ({ pipeline, form, children }) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin, featureFlags } = useAppContext();
  const { showNotification } = useNotification();
  const { dispatch, jsonErrors } = useSaveValidationContext();

  const { draft, reset, buildDto, target } = form;

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglePromptOpen, setIsTogglePromptOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [documentSeed, setDocumentSeed] = useState<PipelineDraft | null>(null);
  const [activeTab, setActiveTab] = useState<EntityViewTab>(EntityViewTab.Properties);

  const tabs = useMemo(() => [propertiesTab(t), auditTab(t)], [t]);

  const readSource = getPipelineInput(pipeline.inputs) || target?.source_table;

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
  const isGroupKeyMissing = draft.trigger?.kind === TriggerKind.Group && !form.grainKey;
  const hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length);
  const isChangeBarShown = isFullAdmin && (isChanged || hasJsonErrors);

  useEffect(() => {
    reset(pipeline);
    setDocumentSeed((seed) => (seed ? storedDocument : seed));
  }, [pipeline, reset, storedDocument]);

  const onDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    reset(pipeline);
    setDocumentSeed(storedDocument);
  }, [dispatch, pipeline, reset, storedDocument]);

  const onToggleEditor = useCallback(() => {
    if (!isEditorEnabled) setDocumentSeed(draftDocument);
    // The strip is withdrawn with the rest of the body while the document is on screen, so leaving
    // the editor has to bring it back on Properties rather than on whatever was selected before.
    setActiveTab(EntityViewTab.Properties);
    setIsEditorEnabled((prev) => !prev);
  }, [isEditorEnabled, draftDocument]);

  const onSave = useCallback(async () => {
    if ((shouldCheckFields && !form.isValid) || isGroupKeyMissing || isSaving) return;

    setIsSaving(true);
    const res = await updatePipeline(pipeline.name, buildDto());
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.Saved)));
      router.refresh();
      return;
    }

    showNotification(
      getErrorNotification(res.errorHeader || t(AnalyticsPipelinesI18nKey.SaveFailed), res.errorMessage, res.requestId),
    );
  }, [
    shouldCheckFields,
    form.isValid,
    isGroupKeyMissing,
    isSaving,
    pipeline.name,
    buildDto,
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
    const res = await updatePipeline(pipeline.name, { ...storedDocument, enabled: !pipeline.enabled });
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.EnabledChanged)));
      router.refresh();
      return;
    }

    showNotification(
      getErrorNotification(res.errorHeader || t(AnalyticsPipelinesI18nKey.SaveFailed), res.errorMessage, res.requestId),
    );
  }, [pipeline, storedDocument, showNotification, t, router]);

  const toggleLabel = t(
    pipeline.enabled ? AnalyticsPipelinesI18nKey.DisablePipeline : AnalyticsPipelinesI18nKey.EnablePipeline,
  );

  const toggleProps = {
    label: toggleLabel,
    disabled: isChanged || isSaving,
    title: isChanged ? t(AnalyticsPipelinesI18nKey.ToggleBlockedByEdits) : undefined,
    onClick: () => setIsTogglePromptOpen(true),
  };

  const enabledToggle = pipeline.enabled ? (
    <DialDangerButton {...toggleProps} appearance={ButtonAppearance.Outlined} />
  ) : (
    <DialPrimaryButton {...toggleProps} />
  );

  // One fallback for both conditions: with analytics disabled, or while the JSON editor holds the
  // view, the Properties body is everything below the identity row — no strip, and no Audit tab to
  // issue an analytics activity request from. There is no pipeline-status condition: `enabled` is a
  // runtime toggle, and gating on it would hide the history of the toggle itself.
  const isTabStripShown = !!featureFlags.analyticsEnabled && !isEditorEnabled;
  const isAuditShown = isTabStripShown && activeTab === EntityViewTab.Audit;

  const properties = (
    <>
      <PipelineReadOnlyFacts pipeline={pipeline} readSource={readSource} />
      <div className="flex flex-col gap-y-6 pt-6">
        {children}
        <PipelineStateSection state={pipeline.state} />
      </div>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {!isEditorEnabled && <PipelineEnabledBadge enabled={pipeline.enabled} className="self-start" />}
          <div className="flex items-center gap-2">
            <h1 className="text-primary dial-h4">{pipeline.name}</h1>
            <CopyButton value={pipeline.name} valueLabel={t(AnalyticsPipelinesI18nKey.Name)} />
          </div>
        </div>

        <div className="flex flex-row items-center gap-3">
          {isChangeBarShown && (
            <ChangedEntityButtons
              disableSave={(shouldCheckFields && !form.isValid) || isGroupKeyMissing || isSaving}
              onDiscard={onDiscard}
              onSave={onTryToSave}
            />
          )}
          {isFullAdmin && !isEditorEnabled && enabledToggle}
          {!isChangeBarShown && <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />}
        </div>
      </div>

      {isTogglePromptOpen && (
        <DialConfirmationPopup
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

      {isTabStripShown && (
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={(tab) => setActiveTab(tab as EntityViewTab)} />
      )}

      <div className="flex-1 overflow-auto min-h-0 flex flex-col">
        {isEditorEnabled && (
          <EntityJsonEditor entity={documentSeed} setSelectedEntity={form.replaceDraft} readonly={!isFullAdmin} />
        )}
        {isAuditShown && (
          <div className="flex min-h-0 flex-1 flex-col">
            <PipelineAudit pipeline={pipeline} />
          </div>
        )}
        {!isEditorEnabled && !isAuditShown && properties}
      </div>
    </div>
  );
};

export default PipelineDetailFrame;
