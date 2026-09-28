import { BaseEntity } from './base-entity';
import { CoreResourceEntityMetadata } from './resource';

export interface DialConversation extends BaseEntity {
  descriptionKeywords: string[];
  /**
   * A merged detail entity (`mergeConversation`) grafts these three under `_metadata` instead of
   * setting them here — narrowed to optional (mirroring `DialFile.folderId`, see task 2.2) so that
   * merge no longer needs an `as unknown as` cast to bypass the structural check.
   */
  path?: string;
  folderId?: string;
  author?: string;
  endpoint: string;
  iconUrl: string;
  temperature: number;
  messages: DialMessage[];
  model?: {
    id: string;
  };
  prompt?: string;
  /** See `DialPrompt._metadata` — grafted identity/audit fields of a merged detail entity. */
  _metadata?: CoreResourceEntityMetadata;
}

export interface DialMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  responseId?: string;
  settings?: Record<string, unknown>;
  templateMapping?: string[];
  model?: {
    id: string;
  };
}
