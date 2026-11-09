import { describe, expect, test } from 'vitest';

import {
  applyRouterMode,
  compactDecision,
  getRouterMode,
  isValidMaxDecisions,
  isValidTimeoutMs,
  parseDecisionNumber,
} from '@/src/components/Assets/Platform/Routers/utils';
import { InterfaceMode } from '@/src/models/dial/interfaces';
import { DialRouterResource } from '@/src/models/dial/resource';
import { RouterMode } from '@/src/models/dial/router';

describe('Routers :: decision value helpers', () => {
  test('parseDecisionNumber reads empty as absent and text as NaN', () => {
    expect(parseDecisionNumber(undefined)).toBeUndefined();
    expect(parseDecisionNumber('  ')).toBeUndefined();
    expect(parseDecisionNumber('2000')).toBe(2000);
    expect(parseDecisionNumber('abc')).toBeNaN();
  });

  test.each([
    [undefined, true],
    [1, true],
    [5000, true],
    [0, false],
    [-1, false],
    [1.5, false],
    [Number.NaN, false],
  ])('isValidTimeoutMs(%s) is %s', (value, expected) => {
    expect(isValidTimeoutMs(value)).toBe(expected);
  });

  test.each([
    [undefined, true],
    [1, true],
    [10, true],
    [0, false],
    [11, false],
    [2.5, false],
    [Number.NaN, false],
  ])('isValidMaxDecisions(%s) is %s', (value, expected) => {
    expect(isValidMaxDecisions(value)).toBe(expected);
  });

  test('compactDecision drops an object holding nothing', () => {
    expect(compactDecision({ body: undefined, timeoutMs: undefined })).toBeUndefined();
    expect(compactDecision({ body: true, timeoutMs: undefined })).toEqual({ body: true });
  });
});

describe('Routers :: mode', () => {
  test('a router with no stored mode reads as proxy', () => {
    expect(getRouterMode({})).toBe(RouterMode.Proxy);
    expect(getRouterMode({ mode: RouterMode.Decision })).toBe(RouterMode.Decision);
  });

  test('switching to proxy removes mode and the whole decision object', () => {
    const router = { name: 'r1', mode: RouterMode.Decision, decision: { body: true } } as DialRouterResource;

    const result = applyRouterMode(router, RouterMode.Proxy);

    expect(result.mode).toBeUndefined();
    expect(result.decision).toBeUndefined();
  });

  test('switching to decision turns translated interfaces into passthrough and keeps the rest', () => {
    const router = {
      name: 'r1',
      interfaces: {
        openaiChatCompletions: { base_url: 'http://a' },
        anthropicMessages: { mode: InterfaceMode.Translator, translator: 'to-anthropic' },
      },
    } as unknown as DialRouterResource;

    const result = applyRouterMode(router, RouterMode.Decision);

    expect(result.mode).toBe(RouterMode.Decision);
    expect(result.interfaces?.openaiChatCompletions).toEqual({ base_url: 'http://a' });
    expect(result.interfaces?.anthropicMessages.mode).toBeUndefined();
    expect(result.interfaces?.anthropicMessages.translator).toBeUndefined();
  });

  test('switching to decision keeps a router with no interfaces valid', () => {
    expect(applyRouterMode({ name: 'r1' } as DialRouterResource, RouterMode.Decision).interfaces).toBeUndefined();
  });
});
