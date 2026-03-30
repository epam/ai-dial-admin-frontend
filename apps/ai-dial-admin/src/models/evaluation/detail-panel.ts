export interface ParsedValue {
  displayText: string;
  rawText: string;
  typeChip?: string;
  isLong: boolean;
}

export type ViewerContentType = 'json' | 'text';

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
