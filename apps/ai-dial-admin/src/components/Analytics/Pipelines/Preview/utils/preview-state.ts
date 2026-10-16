import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { PipelinePreview, PreviewNote, PreviewNoteCode } from '@/src/models/analytics/pipeline-preview';

import { FAILURE_CODES, HTTP_FORBIDDEN, REQUEST_TEMPLATE_MEMBER } from '../constants';
import { PreviewEmptyKind, PreviewFailure, PreviewFailureKind, PreviewSection } from '../models';

const isGroupTrigger = (pipeline: Pipeline): boolean => pipeline.trigger?.kind === TriggerKind.Group;

/** What the tab says before the first run, which differs by what the preview of that pipeline returns. */
export const getFirstVisitKey = (pipeline: Pipeline): PipelinePreviewI18nKey => {
  if (pipeline.kind === PipelineKind.Aggregate) return PipelinePreviewI18nKey.FirstVisitAggregate;
  if (pipeline.transform?.type === TransformType.Sql) return PipelinePreviewI18nKey.FirstVisitSql;

  return isGroupTrigger(pipeline) ? PipelinePreviewI18nKey.FirstVisitLlmGroup : PipelinePreviewI18nKey.FirstVisitLlmRow;
};

export const findNote = (notes: PreviewNote[], code: PreviewNoteCode): PreviewNote | undefined =>
  notes.find((note) => note.code === code);

/**
 * Why a sample came back empty. The service's note decides that the sample is empty and why; the one thing it
 * cannot say — whether an empty input or a filter is to blame — comes from whether the saved declaration has a filter.
 */
export const getEmptyKind = ({ rows, notes }: PipelinePreview, pipeline: Pipeline): PreviewEmptyKind | undefined => {
  if (rows.length > 0) return undefined;
  if (findNote(notes, PreviewNoteCode.NoGroupFound)) return PreviewEmptyKind.NoGroup;
  if (findNote(notes, PreviewNoteCode.HeldByEnrichment)) return PreviewEmptyKind.Held;

  return pipeline.filter?.trim() ? PreviewEmptyKind.NoMatch : PreviewEmptyKind.NoData;
};

export const getFailureKind = ({ code, status }: PreviewFailure): PreviewFailureKind => {
  if (code === FAILURE_CODES.validation) return PreviewFailureKind.Validation;
  if (code === FAILURE_CODES.budget) return PreviewFailureKind.Budget;
  if (code === FAILURE_CODES.storage) return PreviewFailureKind.Storage;
  if (status === HTTP_FORBIDDEN || (code != null && (FAILURE_CODES.noAccess as readonly string[]).includes(code))) {
    return PreviewFailureKind.NoAccess;
  }

  return PreviewFailureKind.Generic;
};

/**
 * The part of the declaration to offer opening for a refused run. A budget refusal points at what makes the read
 * heavy for this kind; a validation failure points at the request template only when its message names it.
 */
export const getRemedySection = (
  kind: PreviewFailureKind.Budget | PreviewFailureKind.Validation,
  pipeline: Pipeline,
  message?: string,
): PreviewSection => {
  if (kind === PreviewFailureKind.Validation) {
    const isTemplateProblem =
      pipeline.transform?.type === TransformType.Llm && Boolean(message?.includes(REQUEST_TEMPLATE_MEMBER));

    return isTemplateProblem ? PreviewSection.RequestTemplate : PreviewSection.Properties;
  }

  // A SQL declaration has no group keys section to open: its statement is on Properties.
  if (pipeline.kind === PipelineKind.Aggregate) {
    return pipeline.sql !== undefined ? PreviewSection.Properties : PreviewSection.GroupKeys;
  }
  if (pipeline.transform?.type !== TransformType.Llm) return PreviewSection.Properties;

  return isGroupTrigger(pipeline) ? PreviewSection.MemberSelection : PreviewSection.Inputs;
};
