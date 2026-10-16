import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import { FrameMessage } from '@/src/components/FrameRenderer/models';

const FRAME_MESSAGE_TYPES = new Set<unknown>(Object.values(FrameMessageType));

export const isFrameMessageType = (type: unknown): type is FrameMessageType => FRAME_MESSAGE_TYPES.has(type);

export const getFrameOrigin = (iframeUrl: string): string | null => {
  try {
    return new URL(iframeUrl).origin;
  } catch {
    return null;
  }
};

/** QuickApps nests the text under `payload`; ai-dial-chat reads it flat — accept both. */
export const getSaveErrorMessage = (message: FrameMessage): string | undefined =>
  message.payload?.error ?? message.error;
