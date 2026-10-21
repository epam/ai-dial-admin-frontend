import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';

/**
 * Every asset view resolves its folder context through `AssetFolderContextMap`, and that hook throws
 * at runtime unless the matching provider is mounted. `test-setup` mocks all of these contexts, so a
 * missing mount is invisible to every other test — this asserts the wiring directly against the
 * source instead: each provider is listed in `AssetFolderProviders`, and the `[lang]` layout mounts
 * that composition around the app shell.
 */
const PROVIDER_BY_VIEW: Partial<Record<ApplicationRoute, string>> = {
  [ApplicationRoute.Prompts]: 'PromptFolderProvider',
  [ApplicationRoute.AssetsApplications]: 'AppsFolderProvider',
  [ApplicationRoute.AssetsToolsets]: 'ToolsetFolderProvider',
  [ApplicationRoute.Conversations]: 'ConversationFolderProvider',
  [ApplicationRoute.PlatformModels]: 'ModelsFolderProvider',
  [ApplicationRoute.PlatformAppRunners]: 'AppRunnersFolderProvider',
  [ApplicationRoute.Skills]: 'SkillFolderProvider',
};

const layout = readFileSync(join(__dirname, '../../../../app/[lang]/layout.tsx'), 'utf-8');
const assetFolderProviders = readFileSync(
  join(__dirname, '../../../../context/assets/AssetFolderProviders.tsx'),
  'utf-8',
);
const composedProviders = assetFolderProviders.slice(assetFolderProviders.indexOf('composeProviders(['));

describe('Asset folder providers :: wiring', () => {
  test.each(Object.entries(PROVIDER_BY_VIEW))('Should compose %s’s provider (%s)', (_view, provider) => {
    expect(assetFolderProviders).toContain(`import { ${provider} }`);
    expect(composedProviders).toContain(`  ${provider},`);
  });

  test('Should mount the composed providers in the layout around the app shell', () => {
    expect(layout).toContain("import { AssetFolderProviders } from '@/src/context/assets/AssetFolderProviders';");
    expect(layout).toContain('<AssetFolderProviders>');
    expect(layout).toContain('</AssetFolderProviders>');
  });
});
