import ApplicationIcon from '@/public/images/assets-application-icon.svg';
import ConversationIcon from '@/public/images/assets-conversation-icon.svg';
import PromptIcon from '@/public/images/assets-prompt-icon.svg';
import SkillIcon from '@/public/images/assets-skill-icon.svg';
import ToolsetIcon from '@/public/images/assets-toolset-icon.svg';
import { TypeIconComponent } from '@/src/components/Grid/CellRenderers/models';
import { ApplicationRoute } from '@/src/types/routes';

// Views absent from the map (platform buckets, files) keep the initials fallback.
export const ASSET_TYPE_ICONS: Partial<Record<ApplicationRoute, TypeIconComponent>> = {
  [ApplicationRoute.AssetsApplications]: ApplicationIcon,
  [ApplicationRoute.AssetsToolsets]: ToolsetIcon,
  [ApplicationRoute.Prompts]: PromptIcon,
  [ApplicationRoute.Skills]: SkillIcon,
  [ApplicationRoute.Conversations]: ConversationIcon,
};
