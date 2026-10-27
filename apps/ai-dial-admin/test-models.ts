export interface EditorMockOptions {
  readOnly?: boolean;
}

export interface EditorMockProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  options?: EditorMockOptions;
}
