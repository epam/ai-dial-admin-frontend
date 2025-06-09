'use server';

import { cookies, headers } from 'next/headers';

import { promptsApi } from '@/src/app/api/api';
import { DialPrompt } from '@/src/models/dial/prompt';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileTypes } from '@/src/types/import';

export async function removePrompt(path?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return promptsApi.removePrompt(token, path);
}

export async function createPrompt(prompt: DialPrompt) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return promptsApi.createPrompt(prompt, token);
}

export async function getPrompt(folderId: string, name: string, version: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await promptsApi.getPromptsList(token, `${folderId}/`);
  const path = prompts?.find((prompt) => prompt.name === name && prompt.version === version)?.path as string;

  return promptsApi.getPrompt(token, path);
}

export async function getPrompts(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await promptsApi.getPromptsList(token, path);

  return prompts;
}

export async function movePrompts(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return promptsApi.movePrompts(token, paths, newPath);
}

export async function importPrompts(body: FormData, fileType: ImportFileTypes) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return promptsApi.importPrompts(token, body, fileType);
}

export async function exportPrompts(paths: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await promptsApi.exportPrompts(token, paths);
}
