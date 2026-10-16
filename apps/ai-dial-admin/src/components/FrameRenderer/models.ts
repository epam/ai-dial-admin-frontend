import { FrameMessageType } from '@/src/components/FrameRenderer/constants';

export interface FrameMessage {
  type: FrameMessageType;
  payload?: {
    isDirty?: boolean;
    isValid?: boolean;
    error?: string;
  };
  error?: string;
}

export interface FrameRendererHandle {
  triggerSave: () => void;
  reset: () => void;
}

export interface FrameCallbacks {
  onDirtyChange?: (isDirty: boolean) => void;
  onValidityChange?: (isValid: boolean) => void;
  onSaveSuccess?: () => void;
  onSaveError?: (message?: string) => void;
}
