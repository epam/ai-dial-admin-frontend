import { ExportFormat } from '@/src/types/export';

export interface JsonConfiguration {
  isEditorEnabled?: boolean;
  selectedFormat?: ExportFormat;

  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onToggleEditor?: () => void;
}
