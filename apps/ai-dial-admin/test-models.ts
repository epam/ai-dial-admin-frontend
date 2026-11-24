export interface EditorMockOptions {
  readOnly?: boolean;
  ariaLabel?: string;
}

export interface EditorMockProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  options?: EditorMockOptions;
}
