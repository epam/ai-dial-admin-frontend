import { Deployment } from '@/src/models/evaluation/deployment';

export interface PlaygroundConfig {
  deployment: Deployment | undefined;
  temperature: number | undefined;
  systemPrompt: string;
}
