import { describe, expect, test } from 'vitest';

import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import {
  formatInfoText,
  getDefaultOpenCard,
  getDetailFields,
  getScoreCards,
  getScoreChipClasses,
  getScoreRunData,
} from '@/src/components/Runs/Details/ValuePopups/utils';
import { MetricInfoSection, ScoreRunData } from '@/src/components/Runs/Details/ValuePopups/models';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { ErrorI18nKey, RunsI18nKey } from '@/src/constants/i18n';

const [primaryRun, secondaryRun] = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

const makeField = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'score',
  label: 'score',
  primaryRaw: '0',
  secondaryRaw: '1',
  diffKind: MetricDeltaKind.Changed,
  isNumeric: true,
  isScoreIndicator: true,
  isMetric: true,
  ...overrides,
});

describe('Runs/FieldCompare :: formatInfoText', () => {
  test('Should return null for null', () => {
    expect(formatInfoText(null)).toBeNull();
  });

  test('Should keep prose as plaintext', () => {
    expect(formatInfoText('The answer is wrong.')).toEqual({ text: 'The answer is wrong.', language: 'plaintext' });
  });

  test('Should pretty-print a JSON object', () => {
    expect(formatInfoText('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}', language: 'json' });
  });

  test('Should pretty-print a JSON array', () => {
    expect(formatInfoText('[1,2]')).toEqual({ text: '[\n  1,\n  2\n]', language: 'json' });
  });

  test('Should fall back to plaintext for brace-led text that is not JSON', () => {
    expect(formatInfoText('{not json')).toEqual({ text: '{not json', language: 'plaintext' });
  });
});

describe('Runs/FieldCompare :: getScoreChipClasses', () => {
  test('Should resolve the absolute bucket of a score', () => {
    expect(getScoreChipClasses('0')).toEqual({ background: 'bg-score-abs-00', text: 'text-score-abs-00' });
    expect(getScoreChipClasses('1')).toEqual({ background: 'bg-score-abs-11', text: 'text-score-abs-11' });
    expect(getScoreChipClasses('0.303')).toEqual({ background: 'bg-score-abs-04', text: 'text-score-abs-04' });
  });

  test('Should return null for a missing, non-numeric or out-of-range value', () => {
    expect(getScoreChipClasses(null)).toBeNull();
    expect(getScoreChipClasses('pass')).toBeNull();
    expect(getScoreChipClasses('1.5')).toBeNull();
    expect(getScoreChipClasses('-0.1')).toBeNull();
  });
});

describe('Runs/FieldCompare :: getScoreRunData', () => {
  test('Should read each run from its own slot', () => {
    const field = makeField({
      primaryInfo: { reason: 'primary reason', logs: 'primary logs', error: null, details: null },
      secondaryInfo: { reason: 'secondary reason', logs: null, error: null, details: null },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);
    const secondary = getScoreRunData(field, secondaryRun, 'Run B', true);

    expect(primary).toMatchObject({ raw: '0', isFailed: false, label: 'Run A', isMissing: false });
    expect(primary.reason?.text).toBe('primary reason');
    expect(primary.logs?.text).toBe('primary logs');
    expect(secondary).toMatchObject({ raw: '1', isFailed: false, label: 'Run B', isMissing: false });
    expect(secondary.reason?.text).toBe('secondary reason');
    expect(secondary.logs).toBeNull();
  });

  test('Should use the group error as the reason of a failed metric without one', () => {
    const field = makeField({
      primaryRaw: null,
      primaryFailed: true,
      primaryInfo: { reason: null, logs: null, error: '422 Unprocessable Content', details: null },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.isFailed).toBe(true);
    expect(primary.isReasonError).toBe(true);
    expect(primary.reason?.text).toBe('422 Unprocessable Content');
    expect(primary.logs).toBeNull();
  });

  test('Should prefer the reason of a failed metric over the group error', () => {
    const field = makeField({
      primaryRaw: null,
      primaryFailed: true,
      primaryInfo: { reason: 'own reason', logs: null, error: 'group error', details: null },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.reason?.text).toBe('own reason');
    expect(primary.isReasonError).toBe(false);
  });

  test('Should not show the group error for a metric that did not fail', () => {
    const field = makeField({ primaryInfo: { reason: null, logs: null, error: 'other leaf failed', details: null } });

    expect(getScoreRunData(field, primaryRun, 'Run A', true).reason).toBeNull();
  });

  test('Should leave reason, details and logs empty without info', () => {
    const data = getScoreRunData(makeField(), primaryRun, 'Run A', true);

    expect(data.reason).toBeNull();
    expect(data.details).toBeNull();
    expect(data.logs).toBeNull();
  });

  test('Should split the details of a run into fields from its own slot', () => {
    const field = makeField({
      primaryInfo: { reason: null, logs: null, error: null, details: '{"tp":1}' },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.detailFields).toEqual([{ key: 'tp', info: { text: '1', language: 'json' } }]);
    expect(primary.details).toBeNull();
    expect(getScoreRunData(field, secondaryRun, 'Run B', true).detailFields).toEqual([]);
  });

  test('Should keep details that are not an object of keys as one block', () => {
    const field = makeField({
      primaryInfo: { reason: null, logs: null, error: null, details: 'a plain note' },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.detailFields).toEqual([]);
    expect(primary.details).toEqual({ text: 'a plain note', language: 'plaintext' });
  });

  test('Should not mistake the details for the reason of a failed metric', () => {
    const field = makeField({
      primaryRaw: null,
      primaryFailed: true,
      primaryInfo: { reason: null, logs: null, error: 'boom', details: '{"tp":1}' },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.reason?.text).toBe('boom');
    expect(primary.detailFields.map(({ key }) => key)).toEqual(['tp']);
  });

  test('Should mark the compared run missing only when there is no match', () => {
    expect(getScoreRunData(makeField(), secondaryRun, 'Run B', false).isMissing).toBe(true);
    expect(getScoreRunData(makeField(), secondaryRun, 'Run B', true).isMissing).toBe(false);
    expect(getScoreRunData(makeField(), primaryRun, 'Run A', false).isMissing).toBe(false);
  });
});

describe('Runs/FieldCompare :: getDetailFields', () => {
  test('Should return a field per key, in the order of the object', () => {
    expect(getDetailFields('{"tp":1,"fp":2}').map(({ key }) => key)).toEqual(['tp', 'fp']);
  });

  test('Should show a string value as plain text', () => {
    expect(getDetailFields('{"verdict":"correct"}')).toEqual([
      { key: 'verdict', info: { text: 'correct', language: 'plaintext' } },
    ]);
  });

  test('Should show numbers, booleans, lists and objects as indented JSON', () => {
    expect(getDetailFields('{"tp":0,"ok":false,"fp":[],"tn":["a"],"nested":{"x":1}}')).toEqual([
      { key: 'tp', info: { text: '0', language: 'json' } },
      { key: 'ok', info: { text: 'false', language: 'json' } },
      { key: 'fp', info: { text: '[]', language: 'json' } },
      { key: 'tn', info: { text: '[\n  "a"\n]', language: 'json' } },
      { key: 'nested', info: { text: '{\n  "x": 1\n}', language: 'json' } },
    ]);
  });

  test('Should return nothing for null, an empty object, an array, a scalar or text that is not JSON', () => {
    expect(getDetailFields(null)).toEqual([]);
    expect(getDetailFields('{}')).toEqual([]);
    expect(getDetailFields('[1, 2]')).toEqual([]);
    expect(getDetailFields('42')).toEqual([]);
    expect(getDetailFields('null')).toEqual([]);
    expect(getDetailFields('a plain note')).toEqual([]);
  });
});

describe('Runs/FieldCompare :: getScoreCards', () => {
  const t = (key: string) => key;
  const text = { text: 'x', language: 'plaintext' };
  const column = (overrides: Partial<ScoreRunData> = {}): ScoreRunData => ({
    ...getScoreRunData(makeField(), primaryRun, 'Run A', true),
    ...overrides,
  });

  test('Should list reason, a card per details field, then logs', () => {
    const cards = getScoreCards(
      column({
        reason: text,
        logs: text,
        detailFields: [
          { key: 'tp', info: text },
          { key: 'fp', info: text },
        ],
      }),
      t,
    );

    expect(cards.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: MetricInfoSection.Reason, title: RunsI18nKey.MetricReason },
      { id: 'field:tp', title: 'tp' },
      { id: 'field:fp', title: 'fp' },
      { id: MetricInfoSection.Logs, title: RunsI18nKey.MetricLogs },
    ]);
  });

  test('Should keep the id of a field apart from the section a key is named after', () => {
    const cards = getScoreCards(column({ reason: text, detailFields: [{ key: 'reason', info: text }] }), t);

    expect(cards.map(({ id }) => id)).toEqual([MetricInfoSection.Reason, 'field:reason']);
  });

  test('Should show the fallback details card when there are no fields', () => {
    const cards = getScoreCards(column({ details: text }), t);

    expect(cards.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: MetricInfoSection.Details, title: RunsI18nKey.MetricDetails },
    ]);
  });

  test('Should title the reason card as an error when the reason is the metric error', () => {
    const [card] = getScoreCards(column({ reason: text, isReasonError: true }), t);

    expect(card.title).toBe(ErrorI18nKey.Error);
  });

  test('Should return no cards for a run with nothing to show', () => {
    expect(getScoreCards(column(), t)).toEqual([]);
  });
});

describe('Runs/FieldCompare :: getDefaultOpenCard', () => {
  const t = (key: string) => key;
  const column = (overrides: Partial<ScoreRunData> = {}): ScoreRunData => ({
    ...getScoreRunData(makeField(), primaryRun, 'Run A', true),
    ...overrides,
  });
  const text = { text: 'x', language: 'plaintext' };
  const fields = [
    { key: 'tp', info: text },
    { key: 'fp', info: text },
  ];

  test('Should open the reason when any column has one', () => {
    const columns = [column({ detailFields: fields, logs: text }), column({ reason: text })];

    expect(getDefaultOpenCard(columns, t)).toBe(MetricInfoSection.Reason);
  });

  test('Should open the first details field when no column has a reason', () => {
    expect(getDefaultOpenCard([column({ detailFields: fields, logs: text })], t)).toBe('field:tp');
  });

  test('Should open the first field of a later column when the first has none', () => {
    expect(getDefaultOpenCard([column(), column({ detailFields: fields })], t)).toBe('field:tp');
  });

  test('Should open the fallback details before the logs', () => {
    expect(getDefaultOpenCard([column({ details: text, logs: text })], t)).toBe(MetricInfoSection.Details);
  });

  test('Should open the logs when they are all there is', () => {
    expect(getDefaultOpenCard([column({ logs: text })], t)).toBe(MetricInfoSection.Logs);
  });

  test('Should open nothing when no column has any card', () => {
    expect(getDefaultOpenCard([column(), column()], t)).toBeNull();
  });
});
