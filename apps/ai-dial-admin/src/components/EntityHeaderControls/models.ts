import { CoreResourceEntityMetadata } from '@/src/models/dial/resource';
import { ExportFormat } from '@/src/types/export';

export interface JsonConfiguration {
  isEditorEnabled?: boolean;
  hideJsonEditorButton?: boolean;
  selectedFormat?: ExportFormat;
  onHideFormatSelector?: () => boolean;
  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onToggleEditor?: () => void;
}

export interface EntityWithMetadata {
  _metadata?: CoreResourceEntityMetadata;
}
