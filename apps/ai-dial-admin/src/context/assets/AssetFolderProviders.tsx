'use client';

import { AppRunnersFolderProvider } from '@/src/context/assets/AppRunnersFolderContext';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { CatalogSchemasFolderProvider } from '@/src/context/assets/CatalogSchemasFolderContext';
import { ConversationFolderProvider } from '@/src/context/assets/ConversationsFolderContext';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { InterceptorsFolderProvider } from '@/src/context/assets/InterceptorsFolderContext';
import { KeysFolderProvider } from '@/src/context/assets/KeysFolderContext';
import { ModelsFolderProvider } from '@/src/context/assets/ModelsFolderContext';
import { ProjectFolderProvider } from '@/src/context/assets/ProjectFolderContext';
import { PromptFolderProvider } from '@/src/context/assets/PromptFolderContext';
import { RolesFolderProvider } from '@/src/context/assets/RolesFolderContext';
import { RoutesFolderProvider } from '@/src/context/assets/RoutesFolderContext';
import { SkillFolderProvider } from '@/src/context/assets/SkillFolderContext';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { TranslatorsFolderProvider } from '@/src/context/assets/TranslatorsFolderContext';
import { composeProviders } from '@/src/context/compose-providers';

export const AssetFolderProviders = composeProviders([
  AppsFolderProvider,
  ModelsFolderProvider,
  AppRunnersFolderProvider,
  CatalogSchemasFolderProvider,
  InterceptorsFolderProvider,
  TranslatorsFolderProvider,
  RoutesFolderProvider,
  RolesFolderProvider,
  KeysFolderProvider,
  PromptFolderProvider,
  ToolsetFolderProvider,
  FileFolderProvider,
  ConversationFolderProvider,
  SkillFolderProvider,
  ProjectFolderProvider,
]);
