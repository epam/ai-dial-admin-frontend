export enum QueryAssistantRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
}

export interface QueryAssistantStage {
  name: string;
  status: string;
  content?: string;
}

export interface QueryAssistantCustomContent {
  state?: unknown;
  stages?: QueryAssistantStage[];
  attachments?: unknown[];
}

export interface QueryAssistantMessage {
  role: QueryAssistantRole;
  content: string;
  custom_content?: QueryAssistantCustomContent;
}

export interface ChatCompletionChoice {
  index: number;
  finish_reason: string;
  message: QueryAssistantMessage;
}

export interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}
