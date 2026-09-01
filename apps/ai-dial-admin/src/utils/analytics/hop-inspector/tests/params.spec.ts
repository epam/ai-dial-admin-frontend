import { describe, expect, test } from 'vitest';

import { paramsOf } from '@/src/utils/analytics/hop-inspector/params';

const valueOf = (body: object, name: string) => paramsOf(body).stated.find((param) => param.name === name)?.value;

describe('paramsOf', () => {
  // `temperature: 0` is the value a reader most often wants confirmed, and `stream: false` is the fact that
  // explains an unframed response. A truthiness test reports both as absent — the opposite of what the body
  // says — so presence is tested as "not null".
  test('states a zero-valued parameter rather than treating it as absent', () => {
    expect(valueOf({ temperature: 0 }, 'temperature')).toBe('0');
    expect(valueOf({ stream: false }, 'stream')).toBe('false');
  });

  test('states an absent parameter with a null value', () => {
    expect(valueOf({ max_tokens: 1024 }, 'temperature')).toBeNull();
  });

  test('always states the four, whatever the body carried', () => {
    expect(paramsOf({}).stated.map(({ name }) => name)).toEqual(['temperature', 'max_tokens', 'tools', 'stream']);
  });

  test('counts a tool catalogue rather than naming its entries', () => {
    const params = paramsOf({ tools: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });

    expect(params.stated.find(({ name }) => name === 'tools')?.value).toBe('3');
    expect(JSON.stringify(params)).not.toContain('"a"');
  });

  test('states a recognised parameter only when the body carries it', () => {
    expect(paramsOf({ top_p: 0.9 }).stated.map(({ name }) => name)).toContain('top_p');
    expect(paramsOf({}).stated.map(({ name }) => name)).not.toContain('top_p');
  });

  // An unbounded parameter list would push the messages off a 360px rail to state keys that are usually
  // vendor passthrough.
  test('counts unrecognised parameters rather than listing them', () => {
    const params = paramsOf({ vendor_flag: 1, another_flag: 2, temperature: 0.2 });

    expect(params.unrecognisedCount).toBe(2);
    expect(params.stated.map(({ name }) => name)).not.toContain('vendor_flag');
  });

  // The conversation itself is not a parameter, and the hop row already states the deployment.
  test('does not count the structural members', () => {
    expect(paramsOf({ messages: [], model: 'gpt', system: 'x' }).unrecognisedCount).toBe(0);
  });

  // Tier 1 hands over whatever `parseJson` produced, which is `null` for a body that would not parse and can
  // be any JSON value for one that did.
  test('a body that is not an object still states the four', () => {
    expect(paramsOf(null).stated).toHaveLength(4);
    expect(paramsOf('a bare string').stated).toHaveLength(4);
    expect(paramsOf([1, 2, 3]).stated).toHaveLength(4);
  });
});
