'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { ConfirmationPopupVariant, DialConfirmationPopup, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { updateRule } from '@/src/app/[lang]/enrichment-rules/actions';
import RuleProperties from '@/src/components/Analytics/EnrichmentRules/Properties/RuleProperties';
import RuleReadOnlyFacts from '@/src/components/Analytics/EnrichmentRules/Properties/RuleReadOnlyFacts';
import { useRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-rule-form';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import RuleEnabledBadge from '@/src/components/Analytics/EnrichmentRules/RuleEnabledBadge';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { EnrichmentRule } from '@/src/models/analytics/rule';
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

  const form = useRuleForm({ rule: originalRule, takenTargets });
  const { draft, reset, buildDto, target } = form;

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglePromptOpen, setIsTogglePromptOpen] = useState(false);

  // DTOs rather than draft-vs-rule: read-only members and the follow/pin inference would each read as an
  // edit that was never made.
  const isChanged = !isEqualSkippingUndefined(
    buildRuleDto(draft, { grainKey: form.grainKey, sourceTable: target?.source_table }),
    buildRuleDto(toRuleDraft(originalRule), { grainKey: form.grainKey, sourceTable: target?.source_table }),
  );

  useEffect(() => reset(originalRule), [originalRule, reset]);

  const onDiscard = useCallback(() => reset(originalRule), [originalRule, reset]);

  const onSave = useCallback(async () => {
    if (!form.isValid || isSaving) return;

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
  }, [form.isValid, isSaving, originalRule.id, buildDto, showNotification, t, router]);

  // Built from the stored rule rather than the draft: PUT is a full replace, so sending the draft here
  // would persist edits the operator has not saved.
  const onToggleEnabled = useCallback(async () => {
    setIsTogglePromptOpen(false);
    setIsSaving(true);
    const res = await updateRule(originalRule.id, {
      ...buildRuleDto(toRuleDraft(originalRule), { grainKey: form.grainKey, sourceTable: target?.source_table }),
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
  }, [originalRule, form.grainKey, target?.source_table, showNotification, t, router]);

  const toggleLabel = t(
    originalRule.enabled ? AnalyticsEnrichmentRulesI18nKey.DisableRule : AnalyticsEnrichmentRulesI18nKey.EnableRule,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-primary dial-h4">{originalRule.name}</h1>
          <span className="text-secondary dial-tiny-text">{originalRule.id}</span>
        </div>

        <RuleEnabledBadge enabled={originalRule.enabled} />
      </div>

      {isFullAdmin && (
        <div className="flex flex-row items-center justify-end gap-3">
          {isChanged && (
            <ChangedEntityButtons
              disableSave={!form.isValid || isSaving}
              onDiscard={onDiscard}
              onSave={() => void onSave()}
            />
          )}
          <DialNeutralButton
            label={toggleLabel}
            // Toggling re-reads the rule, which would drop unsaved edits, so it waits for them to settle.
            disabled={isChanged || isSaving}
            title={isChanged ? t(AnalyticsEnrichmentRulesI18nKey.ToggleBlockedByEdits) : undefined}
            onClick={() => setIsTogglePromptOpen(true)}
          />
        </div>
      )}

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
        <RuleReadOnlyFacts rule={originalRule} />

        <div className="flex flex-col gap-y-6 pt-6">
          <RuleProperties form={form} evaluators={evaluators} hasEvaluatorsError={hasEvaluatorsError} />
        </div>
      </div>
    </div>
  );
};

export default RuleDetailView;
