'use client';

import { FC } from 'react';

import {
  DialItemType,
  DIAL_ICON_SIZE,
  DIAL_KIT_ICON_STROKE,
  ElementSize,
  FileIcon,
  StaticIconButton,
} from '@epam/ai-dial-ui-kit';
import { IconDownload, IconX } from '@tabler/icons-react';

import { ProjectI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { formatContextSize, getFileExtension } from '@/src/utils/project-context';

interface Props {
  name: string;
  /** Size in bytes; absent when it could not be read, in which case only the type is shown. */
  size?: number;
  disabled?: boolean;
  /** Present only for a stored file — a staged one has no content on the server to download yet. */
  onDownload?: () => void;
  onRemove?: () => void;
}

const ACTION_CLASS_NAME =
  'bg-layer-3 opacity-0 group-hover/context-tile:opacity-100 group-focus-within/context-tile:opacity-100';

const getNameWithoutExtension = (name: string): string => {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.slice(0, dotIndex) : name;
};

/**
 * One context file as a tile, like the chat application's attachment card but wider (132 × 100 px) so the size
 * fits beside the extension: the name without its extension, a type icon with the extension and size beneath it, and the actions in the top corner, revealed on
 * hover or keyboard focus. The extension lives in the type row rather than in the name, so a long name clamps
 * without losing what kind of file it is.
 */
const ContextFileCard: FC<Props> = ({ name, size, disabled, onDownload, onRemove }) => {
  const t = useI18n();
  const extension = getFileExtension(name);
  const typeLabel = [extension.toUpperCase(), size != null ? formatContextSize(size) : ''].filter(Boolean).join(' · ');
  const displayName = getNameWithoutExtension(name);

  return (
    <div className="group/context-tile relative box-border flex h-[100px] w-[150px] flex-col items-start justify-between gap-2 overflow-hidden rounded-xl border border-primary bg-layer-3 p-3">
      <div title={displayName} className="dial-tiny-text line-clamp-2 w-full min-w-0 break-words">
        {displayName}
      </div>
      <div className="flex w-full items-end gap-1">
        <FileIcon
          type={DialItemType.File}
          name={name}
          fileExtension={extension || undefined}
          size={DIAL_ICON_SIZE.MD}
          decorative
        />
        <span className="dial-tiny-text min-w-0 flex-1 truncate text-secondary">{typeLabel}</span>
      </div>
      <div className="absolute inset-e-1 top-1 flex">
        {onDownload && (
          <StaticIconButton
            icon={<IconDownload size={DIAL_ICON_SIZE.SM} stroke={DIAL_KIT_ICON_STROKE} aria-hidden />}
            size={ElementSize.Small}
            className={ACTION_CLASS_NAME}
            aria-label={t(ProjectI18nKey.DownloadFile, { name })}
            onClick={onDownload}
          />
        )}
        {onRemove && !disabled && (
          <StaticIconButton
            icon={<IconX size={DIAL_ICON_SIZE.SM} stroke={DIAL_KIT_ICON_STROKE} aria-hidden />}
            size={ElementSize.Small}
            className={ACTION_CLASS_NAME}
            aria-label={t(ProjectI18nKey.RemoveFile, { name })}
            onClick={onRemove}
          />
        )}
      </div>
    </div>
  );
};

export default ContextFileCard;
