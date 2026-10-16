export enum FrameMessageType {
  DirtyState = 'DIRTY_STATE',
  ValidityState = 'VALIDITY_STATE',
  SaveSuccess = 'SAVE_SUCCESS',
  SaveError = 'SAVE_ERROR',
  TriggerSave = 'TRIGGER_SAVE',
  Reset = 'RESET',
}

export const PENDING_SAVE_TIMEOUT_MS = 30_000;
