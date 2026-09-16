'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { Evaluator, EvaluatorRequest, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getEvaluators(): Promise<ServerActionResponse<EvaluatorSummary[]>> {
  return analyticsDataApi.getEvaluators(await token());
}

export async function getEvaluator(name: string): Promise<ServerActionResponse<Evaluator>> {
  return analyticsDataApi.getEvaluator(name, await token());
}

export async function getEvaluatorVersion(name: string, version: number): Promise<ServerActionResponse<Evaluator>> {
  return analyticsDataApi.getEvaluatorVersion(name, version, await token());
}

export async function createEvaluator(dto: EvaluatorRequest): Promise<ServerActionResponse<Evaluator>> {
  return analyticsDataApi.createEvaluator(dto, await token());
}
