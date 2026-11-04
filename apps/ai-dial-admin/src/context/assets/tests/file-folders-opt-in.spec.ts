import { describe, expect, test, vi } from 'vitest';

import { getFileFolderRows } from '@/src/context/assets/file-folders';

const createFolderContextMock = vi.hoisted(() => vi.fn(() => ({ Provider: () => null, useFolderContext: () => ({}) })));

vi.mock('@/src/context/assets/AssetsFolderContext', () => ({ createFolderContext: createFolderContextMock }));

// test-setup.tsx stubs most folder contexts for every other spec; this one needs the real modules.
vi.unmock('@/src/context/assets/FileFolderContext');
vi.unmock('@/src/context/assets/PromptFolderContext');
vi.unmock('@/src/context/assets/AppsFolderContext');
vi.unmock('@/src/context/assets/ToolsetsFolderContext');
vi.unmock('@/src/context/assets/AppRunnersFolderContext');
vi.unmock('@/src/context/assets/CatalogSchemasFolderContext');
vi.unmock('@/src/context/assets/InterceptorsFolderContext');
vi.unmock('@/src/context/assets/TranslatorsFolderContext');
vi.unmock('@/src/context/assets/RoutesFolderContext');
vi.unmock('@/src/context/assets/RolesFolderContext');
vi.unmock('@/src/context/assets/KeysFolderContext');
vi.unmock('@/src/context/assets/SkillFolderContext');
vi.unmock('@/src/context/assets/ProjectFolderContext');

const OPT_IN_CONTEXTS = [
  'ToolsetsFolderContext',
  'AppsFolderContext',
  'SkillFolderContext',
  'ProjectFolderContext',
  'ConversationsFolderContext',
  'PromptFolderContext',
];
const OTHER_CONTEXTS = [
  'FileFolderContext',
  'ModelsFolderContext',
  'KeysFolderContext',
  'RolesFolderContext',
  'RoutesFolderContext',
  'InterceptorsFolderContext',
  'TranslatorsFolderContext',
  'CatalogSchemasFolderContext',
  'AppRunnersFolderContext',
];

vi.mock('@/src/app/[lang]/files/actions');
vi.mock('@/src/app/[lang]/assets-toolsets/actions');
vi.mock('@/src/app/[lang]/assets-applications/actions');
vi.mock('@/src/app/[lang]/skills/actions');
vi.mock('@/src/app/[lang]/projects/actions');
vi.mock('@/src/app/[lang]/conversations/actions');
vi.mock('@/src/app/[lang]/prompts/actions');

const contextModules = import.meta.glob('../*FolderContext.tsx');

const loadContext = async (name: string) => {
  createFolderContextMock.mockClear();
  await contextModules[`../${name}.tsx`]();
  return createFolderContextMock.mock.calls[0] as unknown[];
};

describe('Files folders opt-in', () => {
  test.each(OPT_IN_CONTEXTS)('%s passes the Files folder source to its folder context', async (name) => {
    const args = await loadContext(name);

    expect(args[3]).toBe(getFileFolderRows);
  });

  test.each(OTHER_CONTEXTS)('%s does not borrow Files folders', async (name) => {
    const args = await loadContext(name);

    expect(args[3]).toBeUndefined();
  });
});
