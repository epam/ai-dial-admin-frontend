'use client';

import { FC, useMemo } from 'react';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import ModelRunStages from '@/src/components/Analytics/Pipelines/Preview/ModelRunStages';
import ModelRunText from '@/src/components/Analytics/Pipelines/Preview/ModelRunText';
import { MODEL_RUN_PANEL_ID } from '@/src/components/Analytics/Pipelines/Preview/constants';
import { formatCount } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import { getCorrectiveRetries, getStageStates } from '@/src/components/Analytics/Pipelines/Preview/utils/model-run';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, TransformPreset, TriggerKind } from '@/src/models/analytics/pipeline';
import { ModelRunEvaluation, ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';

interface Props {
  pipeline: Pipeline;
  evaluation: ModelRunEvaluation;
  subject: string;
  generation?: number;
}

const ModelResultPanel: FC<Props> = ({ pipeline, evaluation, subject, generation }) => {
  const t = useI18n();

  const isGroup = pipeline.trigger?.kind === TriggerKind.Group;
  const preset = pipeline.transform?.preset;
  const isRoute = preset === TransformPreset.DialAppRoute;
  const stages = useMemo(() => getStageStates(evaluation, isGroup), [evaluation, isGroup]);

  const { attempts, usage, latency_ms, outputs, errors, request, response } = evaluation;
  const retries = getCorrectiveRetries(attempts, preset);
  const values = Object.entries(outputs ?? {});

  const facts = [
    {
      label: t(PipelinePreviewI18nKey.FactAttempts),
      value: retries > 0 ? t(PipelinePreviewI18nKey.AttemptsWithRetries, { attempts, retries }) : formatCount(attempts),
    },
    ...(usage
      ? [
          {
            label: t(PipelinePreviewI18nKey.FactUsage),
            value: t(PipelinePreviewI18nKey.UsageAmount, { amount: formatCount(usage.amount), unit: usage.unit }),
          },
        ]
      : []),
    {
      label: t(PipelinePreviewI18nKey.FactLatency),
      value: t(PipelinePreviewI18nKey.LatencyMs, { ms: formatCount(latency_ms) }),
    },
    {
      label: t(isRoute ? PipelinePreviewI18nKey.FactApplication : PipelinePreviewI18nKey.FactDeployment),
      value: pipeline.transform?.model ?? '—',
    },
    ...(isGroup && evaluation.members_included != null
      ? [{ label: t(PipelinePreviewI18nKey.FactMembersSent), value: formatCount(evaluation.members_included) }]
      : []),
    ...(isGroup && evaluation.members_omitted != null
      ? [{ label: t(PipelinePreviewI18nKey.FactMembersOmitted), value: formatCount(evaluation.members_omitted) }]
      : []),
  ];

  return (
    <section
      id={MODEL_RUN_PANEL_ID}
      aria-labelledby={`${MODEL_RUN_PANEL_ID}-title`}
      className="flex flex-col gap-4 rounded border border-secondary p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`${MODEL_RUN_PANEL_ID}-title`} className="dial-h3 break-words">
            {t(PipelinePreviewI18nKey.PanelTitle, { subject })}
          </h3>
          <IdentityTag
            label={t(
              evaluation.status === ModelRunStatus.Ok
                ? PipelinePreviewI18nKey.CellOk
                : PipelinePreviewI18nKey.StateFailed,
            )}
          />
          {isGroup && <span className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.PanelGroupNote)}</span>}
        </div>
        {generation != null && (
          <span className="text-secondary dial-tiny-text">
            {t(PipelinePreviewI18nKey.PanelReadThrough, { generation })}
          </span>
        )}
      </div>

      <ModelRunStages stages={stages} />

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-secondary dial-tiny-text">{label}</dt>
            <dd className="break-words dial-small-semi text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      {isGroup && evaluation.members_truncated && (
        <p className="text-secondary dial-small-text">
          {t(PipelinePreviewI18nKey.PartialGroup, {
            omitted: formatCount(evaluation.members_omitted ?? 0),
            included: formatCount(evaluation.members_included ?? 0),
          })}
        </p>
      )}

      {values.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="dial-small-semi text-primary">{t(PipelinePreviewI18nKey.ValuesTitle)}</h4>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 dial-small-text">
            <dt className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.ValuesColumn)}</dt>
            <dd className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.ValuesValue)}</dd>
            {values.map(([column, value]) => (
              <div key={column} className="contents">
                <dt className="font-mono text-primary">{column}</dt>
                <dd className="break-words text-primary">
                  {value == null ? t(PipelinePreviewI18nKey.CellNull) : renderCell(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="dial-small-semi text-primary">{t(PipelinePreviewI18nKey.ViolationsTitle)}</h4>
          <ul className="flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error} className="break-words font-mono dial-tiny-text text-error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {request != null && (
          <ModelRunText
            title={t(PipelinePreviewI18nKey.RequestTitle)}
            valueLabel={t(PipelinePreviewI18nKey.RequestLabel)}
            text={request}
            isTruncated={evaluation.request_truncated}
            truncatedHint={t(PipelinePreviewI18nKey.TruncatedHint)}
            note={retries > 0 ? t(PipelinePreviewI18nKey.RetryNote) : undefined}
          />
        )}
        {response != null && (
          <ModelRunText
            title={t(PipelinePreviewI18nKey.ReplyTitle)}
            valueLabel={t(PipelinePreviewI18nKey.ReplyLabel)}
            text={response}
            isTruncated={evaluation.response_truncated}
          />
        )}
      </div>
    </section>
  );
};

export default ModelResultPanel;
