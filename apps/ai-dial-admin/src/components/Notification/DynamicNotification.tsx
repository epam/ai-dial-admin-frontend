'use client';
import { IconCircleCheck, IconExclamationCircle, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';
import { DialIconButton } from '@epam/ai-dial-ui-kit';

import { NotificationIcons } from '@/src/components/Notification/Notification';
import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FileDetails, NotificationConfig, NotificationIconColor } from '@/src/models/notification';

function calculateOverallProgress(downloadDetails: FileDetails[]) {
  const inProgressDownloads = downloadDetails.filter((download) => !download.failed && !download.complete);
  if (!inProgressDownloads.length) {
    return null;
  }
  const totalProgress = inProgressDownloads.reduce((sum, item) => sum + item.progress, 0);
  return totalProgress / inProgressDownloads.length;
}

const DynamicNotification: FC<NotificationConfig> = ({ type, title, onClose, downloadDetails }) => {
  const Icon = NotificationIcons[type];
  const iconClassName = classNames('inline mx-2', NotificationIconColor[type]);

  const [files, setFiles] = useState<FileDetails[] | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [detailsShown, setDetailsShown] = useState<boolean>(false);

  const showDetails = useCallback(() => {
    setDetailsShown((prev) => !prev);
  }, [setDetailsShown]);

  useEffect(() => {
    if (downloadDetails?.length) {
      setFiles(downloadDetails);
    }
  }, [downloadDetails]);

  useEffect(() => {
    if (files?.length) {
      setProgress(calculateOverallProgress(files));
    }
  }, [files]);

  return (
    <div className="flex flex-col layer-3 py-2 w-[400px] bg-layer-3 [&:not(:last-child)]:mb-4 rounded shadow">
      <div className="flex flex-row w-full items-center [&:not(:only-child)]:mb-2 px-4">
        <div className="flex items-center relative w-full pr-5">
          <p className="small-text-semi truncate w-full">{title}</p>
          <DialIconButton
            className={classNames(iconClassName, 'w-auto h-auto p-0')}
            onClick={showDetails}
            icon={Icon}
          />
          <DialIconButton
            className="absolute right-0 w-auto h-auto p-0 top-0"
            onClick={onClose}
            icon={<IconX height={18} width={18} />}
          />
        </div>
      </div>
      {progress !== null && (
        <div className="px-4">
          <div className="relative w-full h-0.5 bg-layer-2 px-4">
            <div className="absolute top-0 left-0 h-0.5 bg-controls-accent" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      {detailsShown && files && (
        <div className="max-h-[360px] overflow-y-auto px-4">
          {files?.map((file) => (
            <File key={file.id} {...file} />
          ))}
        </div>
      )}
    </div>
  );
};

const File: FC<FileDetails> = ({ name, progress, failed, complete, onCancel }) => {
  const t = useI18n();
  const fileProgress = `${progress}%`;

  return (
    <div className="flex flex-row content-between w-full mt-2 items-center">
      <p className="w-full tiny text-secondary">{name}</p>
      <div className="flex flex-row items-center content-between">
        {progress && !failed && !complete && (
          <div className="flex flex-row items-center truncate">
            <p className="tiny text-secondary mx-1">{fileProgress}</p>
            <DialIconButton className="w-auto h-auto p-0" icon={<IconX height={18} width={18} />} onClick={onCancel} />
          </div>
        )}
        {failed && (
          <span className="flex flex-row items-center">
            <p className="tiny text-error mx-1">{t(BasicI18nKey.Failed)}</p>
            <IconExclamationCircle className="text-error" {...BASE_BUTTON_ICON_PROPS} />
          </span>
        )}
        {complete && <IconCircleCheck className="dial-tiny text-accent-secondary" {...BASE_BUTTON_ICON_PROPS} />}
      </div>
    </div>
  );
};

export default DynamicNotification;
