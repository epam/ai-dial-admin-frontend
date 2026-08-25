'use client';

import { FC, useState } from 'react';

import {
  DialFormPopup,
  DialInput,
  DialRadioGroup,
  DialSelectField,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import { createRule } from '@/src/app/[lang]/enrichment-rules/actions';
import CronField from '@/src/components/Analytics/EnrichmentRules/CronField';
import DurationField from '@/src/components/Analytics/EnrichmentRules/DurationField';
import OutputBindingsEditor from '@/src/components/Analytics/EnrichmentRules/OutputBindingsEditor';
import { useCreateRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-create-rule-form';
import { LATEST_VERSION } from '@/src/constants/analytics/enrichment-rules';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { TriggerKind } from '@/src/models/analytics/rule';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateRulePopup: FC<Props> = ({ evaluators, hasEvaluatorsError, takenTargets, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const {
    form,
    setField,
    availableTargets,
    isTablesLoading,
    columns,
    outputVars,
    groupBy,
    isBindingsReady,
    isEvaluatorPending,
    isTargetPending,
    hasEvaluatorError,
    hasTargetError,
    hasReadyWhen,
    isCostCeilingValid,
    isSqlWithoutBindings,
    isLlmWithoutBindings,
    canSubmit,
    buildDto,
    setBindings,
  } = useCreateRuleForm(takenTargets);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEvaluator = evaluators.find((item) => item.name === form.evaluatorName);

  const evaluatorOptions = evaluators.map((item) => ({ value: item.name, label: item.name }));

  const latestVersion = selectedEvaluator?.latest_version ?? 0;
  const versionOptions = [
    { value: LATEST_VERSION, label: t(AnalyticsEnrichmentRulesI18nKey.VersionLatest) },
    ...Array.from({ length: latestVersion }, (_, index) => {
      const version = String(latestVersion - index);
      return { value: version, label: version };
    }),
  ];

  const targetOptions = availableTargets.map((table) => ({ value: table.name, label: table.name }));

  const triggerRadios: RadioButtonWithContent[] = [
    { id: TriggerKind.OnIngest, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest) },
    { id: TriggerKind.Schedule, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerSchedule) },
    { id: TriggerKind.Group, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerGroup) },
  ];

  const enabledRadios: RadioButtonWithContent[] = [
    {
      id: 'true',
      name: t(AnalyticsEnrichmentRulesI18nKey.EnabledYes),
      content: (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.EnabledYesCaption)}</span>
      ),
    },
    {
      id: 'false',
      name: t(AnalyticsEnrichmentRulesI18nKey.EnabledNo),
      content: (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.EnabledNoCaption)}</span>
      ),
    },
  ];

  const onSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createRule(buildDto());
    setIsSubmitting(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEnrichmentRulesI18nKey.Created)));
      onCreated();
      onClose();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEnrichmentRulesI18nKey.ActionFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  };

  return (
    <DialFormPopup
      open
      onClose={onClose}
      portalId="create-enrichment-rule"
      size={PopupSize.Md}
      header={t(AnalyticsEnrichmentRulesI18nKey.CreateRuleTitle)}
      submitLabel={t(AnalyticsEnrichmentRulesI18nKey.CreateRule)}
      disableSubmitButton={!canSubmit || isSubmitting}
      onSubmit={() => void onSubmit()}
    >
      <div className="flex flex-col gap-4 p-6">
        <DialInput
          id="rule-name"
          labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.Name), required: true }}
          value={form.name}
          onChange={(v) => setField('name', v ?? '')}
        />

        <DialSelectField
          id="rule-evaluator"
          required
          label={t(AnalyticsEnrichmentRulesI18nKey.Evaluator)}
          options={evaluatorOptions}
          value={form.evaluatorName}
          error={hasEvaluatorError ? t(AnalyticsEnrichmentRulesI18nKey.EvaluatorLoadFailed) : undefined}
          invalid={hasEvaluatorError}
          onChange={(v) => setField('evaluatorName', v as string)}
        />

        {hasEvaluatorsError && (
          <span className="text-error dial-small">{t(AnalyticsEnrichmentRulesI18nKey.EvaluatorsLoadFailed)}</span>
        )}
        {!hasEvaluatorsError && evaluators.length === 0 && (
          <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.NoEvaluatorsNote)}</span>
        )}

        <DialSelectField
          id="rule-evaluator-version"
          label={t(AnalyticsEnrichmentRulesI18nKey.EvaluatorVersion)}
          options={versionOptions}
          value={form.evaluatorVersion}
          disabled={!form.evaluatorName}
          onChange={(v) => setField('evaluatorVersion', v as string)}
        />

        <DialSelectField
          id="rule-target"
          required
          label={t(AnalyticsEnrichmentRulesI18nKey.TargetEnrichment)}
          options={targetOptions}
          value={form.targetEnrichment}
          error={hasTargetError ? t(AnalyticsEnrichmentRulesI18nKey.TargetLoadFailed) : undefined}
          invalid={hasTargetError}
          onChange={(v) => setField('targetEnrichment', v as string)}
        />

        {isTablesLoading && (
          <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.Loading)}</span>
        )}
        {!isTablesLoading && targetOptions.length === 0 && (
          <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.NoAvailableTargets)}</span>
        )}

        <DialRadioGroup
          elementId="rule-trigger-kind"
          fieldTitle={t(AnalyticsEnrichmentRulesI18nKey.TriggerKind)}
          orientation={RadioGroupOrientation.Row}
          radioButtons={triggerRadios}
          activeRadioButton={form.triggerKind}
          onChange={(id) => setField('triggerKind', id as TriggerKind)}
        />

        {form.triggerKind === TriggerKind.Schedule && (
          <CronField value={form.triggerCron} onChange={(v) => setField('triggerCron', v)} />
        )}

        {form.triggerKind === TriggerKind.Group && (
          <div className="flex flex-col gap-4">
            <DialInput
              id="rule-group-by"
              labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.GroupBy) }}
              value={isTargetPending ? t(AnalyticsEnrichmentRulesI18nKey.Loading) : groupBy}
              caption={t(AnalyticsEnrichmentRulesI18nKey.GroupByCaption)}
              readOnly
            />
            <DurationField
              id="rule-ready-idle"
              label={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenIdle)}
              value={form.idle}
              onChange={(v) => setField('idle', v)}
            />
            <DurationField
              id="rule-ready-max-staleness"
              label={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenMaxStaleness)}
              value={form.maxStaleness}
              onChange={(v) => setField('maxStaleness', v)}
            />
            {!hasReadyWhen && (
              <span className="text-error dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenRequired)}</span>
            )}
            <DialInput
              id="rule-cost-ceiling"
              type="number"
              min={1}
              labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenCostCeiling) }}
              value={form.costCeiling}
              error={isCostCeilingValid ? undefined : t(AnalyticsEnrichmentRulesI18nKey.CostCeilingInvalid)}
              invalid={!isCostCeilingValid}
              onChange={(v) => setField('costCeiling', v ?? '')}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-primary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.OutputBindings)}</span>
          {isEvaluatorPending || isTargetPending ? (
            <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.Loading)}</span>
          ) : (
            <OutputBindingsEditor
              rows={form.bindings}
              columns={columns}
              vars={outputVars}
              isReady={isBindingsReady}
              onChange={setBindings}
            />
          )}
          {isSqlWithoutBindings && (
            <span className="text-error dial-tiny-text">
              {t(AnalyticsEnrichmentRulesI18nKey.OutputBindingsRequired)}
            </span>
          )}
          {isLlmWithoutBindings && (
            <span className="text-warning dial-tiny-text">
              {t(AnalyticsEnrichmentRulesI18nKey.OutputBindingsDiscarded)}
            </span>
          )}
        </div>

        <DialRadioGroup
          elementId="rule-enabled"
          fieldTitle={t(AnalyticsEnrichmentRulesI18nKey.Enabled)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={enabledRadios}
          activeRadioButton={form.enabled === null ? '' : String(form.enabled)}
          onChange={(id) => setField('enabled', id === 'true')}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateRulePopup;
