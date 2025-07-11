'use client';
import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { IconX, IconExclamationCircle, IconCircleCheck } from '@tabler/icons-react';

import { NotificationIcons } from '@/src/components/Notification/Notification';
import Button from '@/src/components/Common/Button/Button';
import { useI18n } from '@/src/locales/client';
import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
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
  const iconClassNames = classNames('inline mx-2', NotificationIconColor[type]);

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
    <div
      data-testid={'notification-dynamic'}
      className="flex flex-col layer-3 py-2 w-[400px] bg-layer-3 [&:not(:last-child)]:mb-4 rounded shadow"
    >
      <div className="flex flex-row w-full items-center [&:not(:only-child)]:mb-2 px-4">
        <div className="flex items-center relative w-full pr-5">
          <p className="small-text-semi truncate w-full">{title}</p>
          <Button
            dataTestId={'show-details'}
            cssClass={iconClassNames}
            onClick={showDetails}
            iconBefore={Icon}
          ></Button>
          <Button cssClass={'absolute right-0'} onClick={onClose} iconBefore={<IconX height={18} width={18} />} />
        </div>
      </div>
      {progress !== null && (
        <div data-testid={'progress'} className="px-4">
          <div className="relative w-full h-0.5 bg-layer-2 px-4">
            <div className="absolute top-0 left-0 h-0.5 bg-controls-accent" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      {detailsShown && files && (
        <div className="max-h-[360px] overflow-y-scroll px-4">
          {files?.map((file) => <File key={file.id} {...file} />)}
        </div>
      )}
    </div>
  );
};

const File: FC<FileDetails> = ({ name, progress, failed, complete, onCancel }) => {
  const t = useI18n();
  const fileProgress = `${progress}%`;

  return (
    <div data-testid={'file'} className="flex flex-row content-between w-full mt-2 items-center">
      <p className="w-full tiny text-secondary">{name}</p>
      <div className="flex flex-row items-center content-between">
        {progress && !failed && !complete && (
          <div className="flex flex-row items-center truncate">
            <p className="tiny text-secondary mx-1">{fileProgress}</p>
            <Button iconBefore={<IconX height={18} width={18} />} onClick={onCancel} />
          </div>
        )}
        {failed && (
          <span className="flex flex-row items-center">
            <p className="tiny text-error mx-1">{t(BasicI18nKey.Failed)}</p>
            <i className="text-icon-error">
              <IconExclamationCircle {...BASE_ICON_PROPS} />
            </i>
          </span>
        )}
        {complete && (
          <i className="tiny text-icon-accent-secondary">
            <IconCircleCheck {...BASE_ICON_PROPS} />
          </i>
        )}
      </div>
    </div>
  );
};

export default DynamicNotification;
