'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import { EMPTY_STATE_NOTE_CODES } from '@/src/components/Analytics/Pipelines/Preview/constants';
import PreviewBannerBody from '@/src/components/Analytics/Pipelines/Preview/PreviewBannerBody';
import {
  getNoteTitleKey,
  getSuccessLineKey,
  sortNotes,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-notes';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { PreviewNote, PreviewNoteSeverity } from '@/src/models/analytics/pipeline-preview';

interface Props {
  notes: PreviewNote[];
  /** Whether the result describes the pipeline as it is now; a success line is withheld from one that does not. */
  isCurrent: boolean;
  isEnabled: boolean;
  kind: PipelineKind;
}

/**
 * What the service said about the sample, warnings first. With nothing to say it states what was checked
 * instead, and claims no more than that.
 *
 * `role="status"` on every block, warnings included: the notes arrive with a result the reader asked for, they
 * do not interrupt anything.
 */
const PreviewNotes: FC<Props> = ({ notes, isCurrent, isEnabled, kind }) => {
  const t = useI18n();

  if (notes.length === 0) {
    if (!isCurrent) return null;

    return (
      <Notification
        variant={NotificationVariant.Success}
        type={NotificationType.SectionMessage}
        role="status"
        message={t(getSuccessLineKey(isEnabled, kind))}
      />
    );
  }

  const shown = sortNotes(notes).filter((note) => !EMPTY_STATE_NOTE_CODES.includes(note.code));

  if (shown.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {shown.map((note) => (
        <Notification
          key={`${note.code}:${note.subject ?? ''}`}
          variant={
            note.severity === PreviewNoteSeverity.Warning ? NotificationVariant.Warning : NotificationVariant.Info
          }
          type={NotificationType.SectionMessage}
          role="status"
          message={
            <PreviewBannerBody
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {t(getNoteTitleKey(note.code))}
                  {note.subject && (
                    <span className="rounded bg-accent-primary-alpha px-1.5 font-mono dial-tiny-text text-accent-primary">
                      {note.subject}
                    </span>
                  )}
                </span>
              }
            >
              <span>{note.message}</span>
            </PreviewBannerBody>
          }
        />
      ))}
    </div>
  );
};

export default PreviewNotes;
