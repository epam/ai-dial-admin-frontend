import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';

/**
 * Every asset view resolves its folder context through `AssetFolderContextMap`, and that hook throws
 * at runtime unless the matching provider is mounted in the `[lang]` layout. `test-setup` mocks all of
 * these contexts, so a missing mount is invisible to every other test — this asserts the wiring
 * directly against the layout source instead.
 */
const PROVIDER_BY_VIEW: Partial<Record<ApplicationRoute, string>> = {
  [ApplicationRoute.Prompts]: 'PromptFolderProvider',
  [ApplicationRoute.AssetsApplications]: 'AppsFolderProvider',
  [ApplicationRoute.AssetsToolsets]: 'ToolsetFolderProvider',
  [ApplicationRoute.Conversations]: 'ConversationFolderProvider',
  [ApplicationRoute.AssetsModels]: 'ModelsFolderProvider',
  [ApplicationRoute.AssetsAppRunners]: 'AppRunnersFolderProvider',
};

const layout = readFileSync(join(__dirname, '../../../../app/[lang]/layout.tsx'), 'utf-8');

describe('Asset folder providers :: layout wiring', () => {
  test.each(Object.entries(PROVIDER_BY_VIEW))('Should mount %s’s provider (%s)', (_view, provider) => {
    expect(layout).toContain(`import { ${provider} }`);
    expect(layout).toContain(`<${provider}>`);
    expect(layout).toContain(`</${provider}>`);
  });
});
