import { FC, MouseEvent, ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import EmptyFileArea from './EmptyFileArea';
import FilledInput from './FilledInput';
import { DialRemoveButton } from '@epam/ai-dial-ui-kit';

export interface LoadFileAreaProps {
  emptyTitle: string;
  files?: File[];
  acceptTypes: string;
  maxFilesCount?: number;
  isMultiple?: boolean;
  fileFormatError?: string;
  fileCountError?: string;
  dynamicIcon?: (name: string) => ReactNode;
  iconBeforeInput?: ReactNode;
  onChangeFile: (files: File[]) => void;
  getIsFileFormatError?: (fileItems: File[] | DataTransferItem[]) => boolean;
  isInvalid?: (file: File) => boolean;
  errorText?: string;
}

const LoadFileArea: FC<LoadFileAreaProps> = ({
  acceptTypes,
  emptyTitle,
  files,
  maxFilesCount,
  isMultiple,
  fileFormatError,
  fileCountError,
  iconBeforeInput,
  dynamicIcon,
  onChangeFile,
  isInvalid,
  errorText,
  getIsFileFormatError,
}) => {
  const removeClick = (e: MouseEvent, fileUrl: string) => {
    e.stopPropagation();
    onChangeFile(files?.filter((f) => f.name !== fileUrl) || []);
  };

  const removeFile = (fileUrl: string) => <DialRemoveButton onClick={(e) => removeClick(e, fileUrl)} />;

  const onChange = (files: File[]) => {
    onChangeFile(files);
  };

  return !files || files.length === 0 ? (
    <DndProvider backend={HTML5Backend}>
      <EmptyFileArea
        onChange={onChange}
        acceptTypes={acceptTypes}
        emptyTitle={emptyTitle}
        maxFilesCount={maxFilesCount}
        isMultiple={isMultiple}
        fileFormatError={fileFormatError}
        fileCountError={fileCountError}
        getIsFileFormatError={getIsFileFormatError}
      />
    </DndProvider>
  ) : (
    <div className="flex-1 min-h-0 border border-solid border-primary rounded">
      {files && files.length > 0 && (
        <div className="max-h-full overflow-y-auto">
          {files.map((file, index) => (
            <FilledInput
              key={file.name + index}
              elementId={file.name}
              value={file.name}
              iconAfter={removeFile(file.name)}
              iconBefore={iconBeforeInput || dynamicIcon?.(file.name)}
              isInvalid={isInvalid?.(file)}
              errorText={errorText}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadFileArea;
