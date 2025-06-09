import { AttachmentData, CustomVisualizerData } from '@epam/ai-dial-shared';

export interface VisualizerData extends CustomVisualizerData {
  saveChanges?: boolean;
  jsonEditorEnabled?: boolean;
  pathname?: string;
}

export interface DialAttachmentData extends AttachmentData {
  visualizerData: VisualizerData;
}
