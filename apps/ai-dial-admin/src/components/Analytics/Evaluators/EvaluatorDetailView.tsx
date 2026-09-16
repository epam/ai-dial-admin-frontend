'use client';

import { FC, SetStateAction, useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ConfirmationPopupVariant, DialConfirmationPopup, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import EvaluatorProperties from '@/src/components/Analytics/Evaluators/EvaluatorProperties';
import EvaluatorPipelinesGrid from '@/src/components/Analytics/Evaluators/EvaluatorPipelinesGrid';
import EvaluatorTypeBadge from '@/src/components/Analytics/Evaluators/EvaluatorTypeBadge';
import EvaluatorVersionSwitcher from '@/src/components/Analytics/Evaluators/EvaluatorVersionSwitcher';
import { useEvaluatorForm } from '@/src/components/Analytics/Evaluators/use-evaluator-form';
import { evaluatorDetailHref } from '@/src/components/Analytics/Evaluators/utils';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import HeaderTabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EVALUATOR_IGNORED_FIELDS } from '@/src/constants/editor';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { useI18n } from '@/src/locales/client';
import { CreateEvaluatorDto, Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { toEvaluatorDraft } from '@/src/utils/analytics/evaluator-dto';
import { PipelineListItem } from '@/src/models/analytics/pipeline';
import { ReadFailure } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getEvaluatorTabs } from '@/src/utils/tabs/utils';

interface Props {
  evaluator: Evaluator;
  summary: EvaluatorSummary | null;
  summaryFailure?: ReadFailure | null;
  referencingPipelines: PipelineListItem[] | null;
  referencingFailure?: ReadFailure | null;
}

const EvaluatorDetailView: FC<Props> = ({
  evaluator,
  summary,
  summaryFailure,
  referencingPipelines,
  referencingFailure,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin } = useAppContext();
  const { showNotification } = useNotification();
  const { dispatch, jsonErrors } = useSaveValidationContext();

  const form = useEvaluatorForm({ evaluator, summary });

  useReadFailureNotification(summaryFailure, AnalyticsEvaluatorsI18nKey.VersionListFailed);
  // Reported here rather than in the Pipelines tab: that tab unmounts on a tab switch, and with it the
  // record of having reported, so returning to it raised the same failure again.
  useReadFailureNotification(referencingFailure, AnalyticsEvaluatorsI18nKey.UsedByLoadFailed);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  // Seeded from the version as served rather than from the form's draft: the draft normalizes a version
  // stored before `outputs` into the current shape, which the document would then report as what is
  // stored. What may be sent back is decided on save, by `buildDto`.
  const [documentSeed, setDocumentSeed] = useState<CreateEvaluatorDto | null>(null);

  const nameRegisteredAt = useLocalDateTimeString(summary?.created_at);
  const versionRegisteredAt = useLocalDateTimeString(evaluator.created_at);
  const notSet = t(AnalyticsEvaluatorsI18nKey.NotSet);

  const isDisabled = !isFullAdmin;
  const shouldCheckShape = !isEditorEnabled;
  // EntityJsonEditor forwards only a successful parse, so text the caller broke never reaches the draft —
  // without the markers there is no Discard to back out of it and no Save to be told what is wrong.
  const hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length);
  const isChangeBarShown = isFullAdmin && (form.isChanged || hasJsonErrors);

  // Switching version is a search-param navigation, which does not remount this component: without this the
  // form would keep the previous version's values while the rest of the page showed the new one.
  const { reset } = form;
  useEffect(() => reset(), [reset]);

  // A version stored before `outputs` is edited in the shape it was written in, so what comes back out of
  // the editor is normalized the same way a read is — otherwise a document carrying only `output_vars`
  // would assemble a request with no outputs at all, which the service refuses.
  const onEditedDocument = useCallback(
    (next: SetStateAction<CreateEvaluatorDto>) =>
      form.replaceDraft((prev) => toEvaluatorDraft((typeof next === 'function' ? next(prev) : next) as Evaluator)),
    [form],
  );

  // The document follows the version on screen. Only while the editor is open: seeding it before that
  // would make the toggle show a version the page has since navigated away from.
  useEffect(() => {
    setDocumentSeed((seed) => (seed ? evaluator : seed));
  }, [evaluator]);

  const onSave = useCallback(async () => {
    if ((shouldCheckShape && !form.isValid) || isSaving) return;

    setIsConfirmOpen(false);
    setIsSaving(true);
    const res = await createEvaluator(form.buildDto());
    setIsSaving(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEvaluatorsI18nKey.Created)));
      // The response carries the version the service actually assigned; `nextVersion` is only a prediction,
      // and a concurrent registration would make it someone else's version.
      router.push(evaluatorDetailHref(evaluator.name, res.response?.version));
      router.refresh();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEvaluatorsI18nKey.CreateFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  }, [form, shouldCheckShape, isSaving, showNotification, t, router, evaluator.name]);

  const onTryToSave = useCallback(() => {
    if (isEditorEnabled && jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
      return;
    }

    setIsConfirmOpen(true);
  }, [isEditorEnabled, jsonErrors, showNotification, t, dispatch]);

  const onToggleEditor = useCallback(() => {
    // Entering the editor is barred while anything is unsaved, so the stored version is also the draft.
    if (!isEditorEnabled) setDocumentSeed(evaluator);
    setIsEditorEnabled((prev) => !prev);
  }, [isEditorEnabled, evaluator]);

  // The dispatch has to precede the reset, as in SimpleButtonsWrapper: `EntityJsonEditor` keeps its editor
  // id across the remount, so a stale marker would otherwise hold the change bar up on its own.
  const onDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    form.reset();
    setDocumentSeed(evaluator);
  }, [dispatch, evaluator, form]);

  const tabContent =
    activeTab === EntityViewTab.Properties ? (
      <div className="flex flex-col">
        <section
          aria-label={t(AnalyticsEvaluatorsI18nKey.SectionFacts)}
          className="flex flex-col sm:flex-row gap-8 pb-4 border-b border-primary"
        >
          <LabelledText label={t(AnalyticsEvaluatorsI18nKey.Type)}>
            <EvaluatorTypeBadge type={evaluator.type} className="self-start" />
          </LabelledText>
          <LabelledText
            label={t(AnalyticsEvaluatorsI18nKey.RegisteredAtEvaluator)}
            text={summaryFailure ? t(AnalyticsEvaluatorsI18nKey.Unavailable) : nameRegisteredAt || notSet}
          />
          <LabelledText
            label={t(AnalyticsEvaluatorsI18nKey.RegisteredAtVersion)}
            text={versionRegisteredAt || notSet}
          />
        </section>

        <div className="flex-1 min-h-0 pt-6">
          <EvaluatorProperties form={form} isDisabled={isDisabled} />
        </div>
      </div>
    ) : (
      <EvaluatorPipelinesGrid pipelines={referencingPipelines} />
    );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-row items-center gap-x-2">
          <h1 className="text-primary dial-h4">{evaluator.name}</h1>
          <CopyButton value={evaluator.name} valueLabel={t(AnalyticsEvaluatorsI18nKey.Name)} />
        </div>

        <div className="flex flex-row items-center gap-3">
          <EvaluatorVersionSwitcher
            name={evaluator.name}
            version={evaluator.version}
            latestVersion={summary?.latest_version ?? null}
          />
          {isChangeBarShown ? (
            <ChangedEntityButtons isSaveAllowed={false} onDiscard={onDiscard}>
              <DialPrimaryButton
                label={t(AnalyticsEvaluatorsI18nKey.SaveAsNewVersion)}
                disabled={(shouldCheckShape && !form.isValid) || isSaving}
                onClick={onTryToSave}
              />
            </ChangedEntityButtons>
          ) : (
            <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
          )}
        </div>
      </div>

      {!isEditorEnabled && (
        // HeaderTabs carries `flex-1`, so without this row wrapper it grows vertically in the column.
        // SimpleEntityHeader wraps it the same way.
        // Gated here rather than by passing the flag to HeaderTabs, whose read-only-admin exemption would
        // leave a viewer with tabs that do nothing.
        <div className="flex items-center justify-between gap-4">
          <HeaderTabs tabs={getEvaluatorTabs(t)} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
        </div>
      )}

      {isConfirmOpen && (
        <DialConfirmationPopup
          open
          variant={ConfirmationPopupVariant.Info}
          header={t(AnalyticsEvaluatorsI18nKey.CreateConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsEvaluatorsI18nKey.CreateConfirmDescription)}</span>
              <span className="text-primary dial-small">
                {form.nextVersion
                  ? `${t(AnalyticsEvaluatorsI18nKey.NextVersion)} ${form.nextVersion}`
                  : t(AnalyticsEvaluatorsI18nKey.NextVersionUnknown)}
              </span>
            </div>
          }
          confirmLabel={t(AnalyticsEvaluatorsI18nKey.SaveAsNewVersion)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onConfirm={() => void onSave()}
          onClose={() => setIsConfirmOpen(false)}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}

      <div className="flex-1 overflow-auto min-h-0 flex flex-col">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={documentSeed}
            setSelectedEntity={onEditedDocument}
            ignoredFields={EVALUATOR_IGNORED_FIELDS}
            readonly={isDisabled}
          />
        ) : (
          tabContent
        )}
      </div>
    </div>
  );
};

export default EvaluatorDetailView;
