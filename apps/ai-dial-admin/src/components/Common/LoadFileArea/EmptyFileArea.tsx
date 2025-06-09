import classNames from 'classnames';
import { ChangeEvent, FC, KeyboardEvent, useCallback, useRef } from 'react';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey, CommonControlsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  emptyTitle: string;
  acceptTypes: string;
  onChange: (files: File[]) => void;
}

const EmptyFileArea: FC<Props> = ({ onChange, emptyTitle, acceptTypes }) => {
  const t = useI18n();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        onChange(Array.from(selectedFiles));
      }
    },
    [onChange],
  );

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(selectedFiles: { files: File[] }) {
        onChange(selectedFiles.files);
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [onFileChange],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === 'Enter' || event.key === 'Space') {
      event.preventDefault(); // Prevent scrolling on space press
      fileInputRef.current?.click();
    }
  };

  const containerCssClasses = classNames(
    'border border-dashed rounded w-full cursor-pointer relative h-full hover:border-hover',
    !canDrop && 'border-primary',
    canDrop && (!isOver ? 'border-hover' : 'border-accent-primary'),
  );

  drop(dropRef);

  return (
    <div className={containerCssClasses} ref={dropRef}>
      <label
        htmlFor="file"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex flex-col items-center cursor-pointer h-full w-full text-secondary tiny justify-center"
      >
        <p className="mb-1">{emptyTitle}</p>
        <p className="mb-0.5"> {t(CommonControlsI18nKey.Or)}</p>
        <Button cssClass="tertiary" title={t(BasicI18nKey.Browse)} onClick={() => fileInputRef.current?.click()} />
      </label>
      <input multiple id="file" type="file" ref={fileInputRef} hidden accept={acceptTypes} onChange={onFileChange} />
    </div>
  );
};

export default EmptyFileArea;
