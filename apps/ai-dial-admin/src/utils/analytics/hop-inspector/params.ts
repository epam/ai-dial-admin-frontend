import { HopParam, HopParams } from '@/src/models/analytics/conversations-trace';
import { isRecord } from '@/src/utils/analytics/hop-inspector/envelope';

// Stated on every hop, with a null value where the body carried none. An absent `temperature` is a debugging
// answer — the call ran at the deployment's default — and a line that silently omits it cannot be told apart
// from one the reader did not read carefully.
const ALWAYS_STATED = ['temperature', 'max_tokens', 'tools', 'stream'] as const;

// Recognised, and stated only when carried. Covers both dialects: `stop_sequences`, `top_k` and `thinking`
// belong to the messages dialect, the rest to chat completions.
const RECOGNISED = [
  // The Responses dialect's own token cap — 185 of 199 hops carry it, and it is not `max_tokens`.
  'max_output_tokens',
  'top_p',
  'top_k',
  'tool_choice',
  'response_format',
  'seed',
  'reasoning_effort',
  'thinking',
  'stop',
  'stop_sequences',
  'presence_penalty',
  'frequency_penalty',
  'n',
  'max_completion_tokens',
];

// Structural members, never parameters: they carry the conversation itself, and the hop row already states
// the deployment. Excluded from the unrecognised count so it stays a count of parameters.
// Members that carry the conversation itself rather than a setting: `input` and `instructions` are the
// Responses dialect's spelling of `messages` and the system prompt.
const STRUCTURAL = new Set(['messages', 'model', 'system', 'input', 'instructions', 'custom_fields', 'custom_content']);

const scalarOf = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return String(value.length);
  }

  if (isRecord(value)) {
    return String(Object.keys(value).length);
  }

  return value == null ? null : String(value);
};

// Presence is "not null", never truthiness. `temperature: 0` is real and common — the value a reader most
// often wants confirmed — and `stream: false` is the fact that explains an unframed response. A truthiness
// test reports both as absent, which is the opposite of what the body says.
const isPresent = (body: Record<string, unknown>, name: string): boolean => name in body && body[name] != null;

// Takes the *parsed* body, like every other parser in this folder: parsing here as well meant tier 1 ran
// `JSON.parse` twice over the same string, and 21% of request bodies are above 100 KB.
export const paramsOf = (parsed: unknown): HopParams => {
  if (!isRecord(parsed)) {
    return { stated: ALWAYS_STATED.map((name) => ({ name, value: null })), unrecognisedCount: 0 };
  }

  const stated: HopParam[] = ALWAYS_STATED.map((name) => ({
    name,
    value: isPresent(parsed, name) ? scalarOf(parsed[name]) : null,
  }));

  for (const name of RECOGNISED) {
    if (isPresent(parsed, name)) {
      stated.push({ name, value: scalarOf(parsed[name]) });
    }
  }

  const known = new Set<string>([...ALWAYS_STATED, ...RECOGNISED]);
  const unrecognisedCount = Object.keys(parsed).filter((name) => !known.has(name) && !STRUCTURAL.has(name)).length;

  return { stated, unrecognisedCount };
};
