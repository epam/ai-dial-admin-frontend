import { ExportFormat } from '@/src/types/export';

export interface JsonConfiguration {
  isEditorEnabled?: boolean;
  hideJsonEditorButton?: boolean;
  selectedFormat?: ExportFormat;
  onHideFormatSelector?: () => boolean;
  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onToggleEditor?: () => void;
}
