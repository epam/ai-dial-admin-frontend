'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { CreateEvaluatorDto, Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getEvaluators(): Promise<EvaluatorSummary[] | null> {
  return analyticsDataApi.getEvaluators(await token());
}

export async function getEvaluator(name: string): Promise<Evaluator | null> {
  return analyticsDataApi.getEvaluator(name, await token());
}

export async function getEvaluatorVersion(name: string, version: number): Promise<Evaluator | null> {
  return analyticsDataApi.getEvaluatorVersion(name, version, await token());
}

export async function createEvaluator(dto: CreateEvaluatorDto): Promise<ServerActionResponse<Evaluator>> {
  return analyticsDataApi.createEvaluator(dto, await token());
}
