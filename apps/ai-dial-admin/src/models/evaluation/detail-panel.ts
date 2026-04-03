import { ViewerContentType } from '@/src/types/evaluation';
export { ViewerContentType } from '@/src/types/evaluation';

export interface ParsedValue {
  displayText: string;
  rawText: string;
  typeChip?: string;
  isLong: boolean;
}

export interface InfoEntry {
  metricKey: string;
  entryKey: string;
  value: string;
}

export interface FullscreenViewerState {
  isOpen: boolean;
  title: string;
  content: string;
  contentType: ViewerContentType;
}

export interface FullscreenViewerContextValue {
  open: (title: string, content: string, contentType: ViewerContentType) => void;
  close: () => void;
}
