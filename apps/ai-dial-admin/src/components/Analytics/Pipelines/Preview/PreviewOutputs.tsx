'use client';

import { FC } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, PipelineTransform, TransformOutputBody } from '@/src/models/analytics/pipeline';
import { PreviewNote, PreviewNoteCode } from '@/src/models/analytics/pipeline-preview';

interface Props {
  pipeline: Pipeline;
  notes: PreviewNote[];
}

const proseOf = (outputs: PipelineTransform['outputs'], name: string): string | undefined => {
  const output = outputs?.[name];

  return typeof output === 'string' ? output : (output as TransformOutputBody | null | undefined)?.prose;
};

/**
 * What an LLM pipeline writes, read from the saved declaration in the order the model fills the fields in. The model
 * is not called, so there are no values to show — only the outputs, and which of them the model is told nothing
 * about, which only the service can say, because an output's description defaults to its target column's.
 */
const PreviewOutputs: FC<Props> = ({ pipeline, notes }) => {
  const t = useI18n();

  const outputs = pipeline.transform?.outputs;
  const names = Object.keys(outputs ?? {});

  if (names.length === 0) return null;

  const undescribed = new Set(
    notes.filter((note) => note.code === PreviewNoteCode.OutputWithoutDescription).map((note) => note.subject),
  );

  return (
    <Accordion
      title={t(PipelinePreviewI18nKey.OutputsTitle)}
      description={t(PipelinePreviewI18nKey.OutputsDescription)}
      collapsed={false}
    >
      <ul className="flex flex-col gap-2">
        {names.map((name) => {
          const prose = proseOf(outputs, name);

          return (
            <li key={name} className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono dial-small-semi text-primary">{name}</span>
                {undescribed.has(name) && (
                  <span className="rounded bg-layer-4 px-1.5 uppercase text-secondary dial-tiny-text">
                    {t(PipelinePreviewI18nKey.OutputNoDescription)}
                  </span>
                )}
              </div>
              {prose && <span className="text-secondary dial-small-text">{prose}</span>}
            </li>
          );
        })}
      </ul>
    </Accordion>
  );
};

export default PreviewOutputs;
