'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  ButtonAppearance,
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialDangerButton,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { updateRule } from '@/src/app/[lang]/enrichment-rules/actions';
import RuleProperties from '@/src/components/Analytics/EnrichmentRules/Properties/RuleProperties';
import RuleReadOnlyFacts from '@/src/components/Analytics/EnrichmentRules/Properties/RuleReadOnlyFacts';
import { useRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-rule-form';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import RuleEnabledBadge from '@/src/components/Analytics/EnrichmentRules/RuleEnabledBadge';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { RuleDraft } from '@/src/models/analytics/enrichment-rules-ui';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { buildRuleDto, toRuleDraft } from '@/src/utils/analytics/rule-dto';

interface Props {
  originalRule: EnrichmentRule;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
}

const RuleDetailView: FC<Props> = ({ originalRule, evaluators, hasEvaluatorsError, takenTargets }) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin } = useAppContext();
  const { showNotification } = useNotification();
  const { dispatch, jsonErrors } = useSaveValidationContext();

  const form = useRuleForm({ rule: originalRule, takenTargets });
  const { draft, reset, buildDto, target } = form;

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglePromptOpen, setIsTogglePromptOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  // State rather than derived: `EntityJsonEditor` compares `entity` by identity against the object it last
  // handed up, so a per-render object re-creates the Monaco model on every accepted keystroke.
  const [documentSeed, setDocumentSeed] = useState<RuleDraft | null>(null);

  const assemblyContext = useMemo(
    () => ({ grainKey: form.grainKey, sourceTable: target?.source_table }),
    [form.grainKey, target?.source_table],
  );

  const storedDocument = useMemo(
    () => buildRuleDto(toRuleDraft(originalRule), assemblyContext),
    [originalRule, assemblyContext],
  );

  const draftDocument = useMemo(() => buildRuleDto(draft, assemblyContext), [draft, assemblyContext]);

  // DTOs rather than draft-vs-rule: read-only members and the follow/pin inference would each read as an
  // edit that was never made.
  const isChanged = !isEqualSkippingUndefined(draftDocument, storedDocument);

  const shouldCheckFields = !isEditorEnabled;
  // `group_by` is rebuilt from the resolved target rather than carried through, so saving before the target
  // resolves sends no group key and the full replace erases it — the one field check the editor keeps.
  const isGroupKeyMissing = draft.trigger_kind === TriggerKind.Group && !form.grainKey;
  // EntityJsonEditor forwards only a successful parse, so a broken document leaves `isChanged` false — and
  // a first edit that breaks it would then offer neither Discard nor Save.
  const hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length);
  const isChangeBarShown = isFullAdmin && (isChanged || hasJsonErrors);

  useEffect(() => {
    reset(originalRule);
    setDocumentSeed((seed) => (seed ? storedDocument : seed));
  }, [originalRule, reset, storedDocument]);

  const onDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    reset(originalRule);
    setDocumentSeed(storedDocument);
  }, [dispatch, originalRule, reset, storedDocument]);

  const onToggleEditor = useCallback(() => {
    if (!isEditorEnabled) setDocumentSeed(draftDocument);
    setIsEditorEnabled((prev) => !prev);
  }, [isEditorEnabled, draftDocument]);

  const onSave = useCallback(async () => {
    if ((shouldCheckFields && !form.isValid) || isGroupKeyMissing || isSaving) return;

    setIsSaving(true);
    const res = await updateRule(originalRule.id, buildDto());
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEnrichmentRulesI18nKey.Saved)));
      // `generation` and `updated_at` change on every accepted mutation, so the facts need a re-read.
      router.refresh();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEnrichmentRulesI18nKey.SaveFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  }, [
    shouldCheckFields,
    form.isValid,
    isGroupKeyMissing,
    isSaving,
    originalRule.id,
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

  // Built from the stored rule rather than the draft: PUT is a full replace, so sending the draft here
  // would persist edits the operator has not saved.
  const onToggleEnabled = useCallback(async () => {
    setIsTogglePromptOpen(false);
    setIsSaving(true);
    const res = await updateRule(originalRule.id, {
      ...storedDocument,
      enabled: !originalRule.enabled,
    });
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEnrichmentRulesI18nKey.EnabledChanged)));
      router.refresh();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEnrichmentRulesI18nKey.SaveFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  }, [originalRule, storedDocument, showNotification, t, router]);

  const toggleLabel = t(
    originalRule.enabled ? AnalyticsEnrichmentRulesI18nKey.DisableRule : AnalyticsEnrichmentRulesI18nKey.EnableRule,
  );

  // Shared by both directions of the toggle, which differ only in the button they are spread onto.
  const toggleProps = {
    label: toggleLabel,
    // Toggling re-reads the rule, which would drop unsaved edits, so it waits for them to settle.
    disabled: isChanged || isSaving,
    title: isChanged ? t(AnalyticsEnrichmentRulesI18nKey.ToggleBlockedByEdits) : undefined,
    onClick: () => setIsTogglePromptOpen(true),
  };

  // Outlined danger, the treatment SimpleButtonsWrapper gives Delete: disabling stops an enrichment other
  // things depend on, while enabling only restores the expected state.
  const enabledToggle = originalRule.enabled ? (
    <DialDangerButton {...toggleProps} appearance={ButtonAppearance.Outlined} />
  ) : (
    <DialPrimaryButton {...toggleProps} />
  );

  const fieldsContent = (
    <>
      <RuleReadOnlyFacts rule={originalRule} />

      <div className="flex flex-col gap-y-6 pt-6">
        <RuleProperties form={form} evaluators={evaluators} hasEvaluatorsError={hasEvaluatorsError} />
      </div>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {!isEditorEnabled && <RuleEnabledBadge enabled={originalRule.enabled} className="self-start" />}
          <h1 className="text-primary dial-h4">{originalRule.name}</h1>
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
            originalRule.enabled
              ? AnalyticsEnrichmentRulesI18nKey.DisableConfirmTitle
              : AnalyticsEnrichmentRulesI18nKey.EnableConfirmTitle,
          )}
          description={t(
            originalRule.enabled
              ? AnalyticsEnrichmentRulesI18nKey.DisableConfirmDescription
              : AnalyticsEnrichmentRulesI18nKey.EnableConfirmDescription,
          )}
          confirmLabel={toggleLabel}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onConfirm={() => void onToggleEnabled()}
          onClose={() => setIsTogglePromptOpen(false)}
          onCancel={() => setIsTogglePromptOpen(false)}
        />
      )}

      <div className="flex-1 overflow-auto min-h-0 flex flex-col">
        {isEditorEnabled ? (
          <EntityJsonEditor entity={documentSeed} setSelectedEntity={form.replaceDraft} readonly={!isFullAdmin} />
        ) : (
          fieldsContent
        )}
      </div>
    </div>
  );
};

export default RuleDetailView;
