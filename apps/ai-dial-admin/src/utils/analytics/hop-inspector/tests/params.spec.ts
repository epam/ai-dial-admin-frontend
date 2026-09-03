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

  test('states a parameter it does not recognise under its own recorded key', () => {
    const params = paramsOf({ temperature: 0, vendor_knob: 7, another_one: 'x' });

    expect(params.stated).toEqual(
      expect.arrayContaining([
        { name: 'vendor_knob', value: '7' },
        { name: 'another_one', value: 'x' },
      ]),
    );
  });

  test('states the settings a reader looks for by name before the rest', () => {
    const names = paramsOf({ vendor_knob: 7, temperature: 0, top_p: 1 }).stated.map(({ name }) => name);

    expect(names.slice(0, 4)).toEqual(['temperature', 'max_tokens', 'tools', 'stream']);
    expect(names.indexOf('top_p')).toBeLessThan(names.indexOf('vendor_knob'));
  });

  // The only members left out are the ones the history renders in full.
  test('leaves out the members that carry the conversation itself', () => {
    const names = paramsOf({ messages: [], system: 'x', input: [], instructions: 'y' }).stated.map(({ name }) => name);

    expect(names).toEqual(['temperature', 'max_tokens', 'tools', 'stream']);
  });

  // The row names the deployment, which is a different string from the model the client asked for.
  test('states the model the request asked for', () => {
    expect(paramsOf({ model: 'us.anthropic.claude-sonnet-4-6' }).stated).toEqual(
      expect.arrayContaining([{ name: 'model', value: 'us.anthropic.claude-sonnet-4-6' }]),
    );
  });

  // An envelope is why a message's recorded size can run far past its visible text, so its presence is
  // stated — by its number of keys, never by its content.
  test('states a state envelope by its size rather than its content', () => {
    expect(paramsOf({ custom_content: { state: { a: 1 }, attachments: [] } }).stated).toEqual(
      expect.arrayContaining([{ name: 'custom_content', value: '2' }]),
    );
  });

  // Tier 1 hands over whatever `parseJson` produced, which is `null` for a body that would not parse and can
  // be any JSON value for one that did.
  test('a body that is not an object still states the four', () => {
    expect(paramsOf(null).stated).toHaveLength(4);
    expect(paramsOf('a bare string').stated).toHaveLength(4);
    expect(paramsOf([1, 2, 3]).stated).toHaveLength(4);
  });
});
