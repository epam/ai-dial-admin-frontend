'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { CreateRuleDto, EnrichmentRule, EnrichmentRuleListItem, RulesListFilters } from '@/src/models/analytics/rule';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toRuleListItem } from '@/src/utils/analytics/rule-list-item';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getRules(filters?: RulesListFilters): Promise<EnrichmentRuleListItem[] | null> {
  const rules = await analyticsDataApi.getRules(filters, await token());
  return rules?.map(toRuleListItem) ?? null;
}

export async function getRule(id: string): Promise<EnrichmentRule | null> {
  return analyticsDataApi.getRule(id, await token());
}

export async function createRule(dto: CreateRuleDto): Promise<ServerActionResponse> {
  return analyticsDataApi.createRule(dto, await token());
}

export async function updateRule(id: string, dto: CreateRuleDto): Promise<ServerActionResponse> {
  return analyticsDataApi.updateRule(id, dto, await token());
}

export async function deleteRule(id: string): Promise<ServerActionResponse> {
  return analyticsDataApi.deleteRule(id, await token());
}

export async function getEvaluators(): Promise<EvaluatorSummary[] | null> {
  return analyticsDataApi.getEvaluators(await token());
}

export async function getEvaluator(name: string): Promise<Evaluator | null> {
  return analyticsDataApi.getEvaluator(name, await token());
}

export async function getEvaluatorVersion(name: string, version: number): Promise<Evaluator | null> {
  return analyticsDataApi.getEvaluatorVersion(name, version, await token());
}

export async function getTables(): Promise<AnalyticsTable[] | null> {
  return analyticsDataApi.getTables(await token());
}

export async function getTable(name: string): Promise<AnalyticsTable | null> {
  return analyticsDataApi.getTable(name, await token());
}
