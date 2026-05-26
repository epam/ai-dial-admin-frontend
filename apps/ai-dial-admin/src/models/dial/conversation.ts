import { BaseEntity } from './base-entity';

export interface DialConversation extends BaseEntity {
  descriptionKeywords: string[];
  path: string;
  folderId: string;
  version: string;
  author: string;
  endpoint: string;
  iconUrl: string;
  temperature: number;
  messages: DialMessage[];
  model?: {
    id: string;
  };
  prompt?: string;
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
