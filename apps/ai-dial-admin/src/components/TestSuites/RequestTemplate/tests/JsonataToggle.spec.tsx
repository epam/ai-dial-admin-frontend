import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { TestSuite, TestSuiteRequestTemplateBody } from '@/src/models/evaluation/test-suite';
import { FormDataType } from '@/src/models/form-data';
import JsonataToggle from '../components/JsonataToggle';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSwitch: ({ switchId, label, isOn, onChange }: any) => (
      <button
        type="button"
        role="switch"
        aria-checked={!!isOn}
        aria-label={typeof label === 'string' ? label : switchId}
        onClick={() => onChange?.(!isOn)}
      />
    ),
  };
});

const createTestSuite = (body?: TestSuiteRequestTemplateBody): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite',
  requestTemplate: { urlTemplate: '/api', body },
});

const JSONATA_EXPRESSION = [
  '{',
  '    "messages": $append($history, [{ "role": "user", "content": "${{user_message}}" }]),',
  '    "temperature": "${{temperature:0.7}}"',
  '}',
].join('\n');

describe('JsonataToggle', () => {
  let mockOnChangeTestSuite: Mock;

  const clickSwitch = () => fireEvent.click(screen.getByRole('switch'));
  const bodyOfCall = (index: number) => mockOnChangeTestSuite.mock.calls[index][0].requestTemplate.body;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
  });

  describe('isOn reflects jsonataContent != null', () => {
    test('is off when body is undefined', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite(undefined)}
          bodyText="{}"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    test('is off when jsonataContent is absent', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: {} })}
          bodyText="{}"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    test('is on when jsonataContent is the empty string (hand-cleared, not just-toggled-on)', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '' })}
          bodyText=""
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    test('is on when jsonataContent is a non-empty string', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ jsonataContent: '$sum(items.price)' })}
          bodyText="$sum(items.price)"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    test('stays on when a seeded expression is hand-cleared to an empty string', () => {
      const { rerender } = render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '{}' })}
          bodyText="{}"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      rerender(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '' })}
          bodyText=""
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('turning on', () => {
    test('writes the current body text into jsonataContent and omits content', () => {
      const content = { model: 'gpt-4' };
      const bodyText = JSON.stringify(content, null, 4);

      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content })}
          bodyText={bodyText}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
      expect('jsonataContent' in bodyOfCall(0)).toBe(true);
      expect(bodyOfCall(0).jsonataContent).toBe(bodyText);
      expect('content' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).contentType).toBe(ContentType.JSON);
    });

    test('writes text that is not valid JSON verbatim, without requiring it to parse', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: {} })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).jsonataContent).toBe(JSONATA_EXPRESSION);
      expect('content' in bodyOfCall(0)).toBe(false);
    });

    test('clears registered JSON editor errors so save is not blocked by the prior mode', () => {
      const { dispatch } = useSaveValidationContext();

      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: {} })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.SetJsonEditor, errors: [] });
    });

    test('writes the empty string when the editor was cleared', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: {} })}
          bodyText=""
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).jsonataContent).toBe('');
      expect('content' in bodyOfCall(0)).toBe(false);
    });

    test('does not serialize form-data parts into the expression', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({
            contentType: ContentType.FormData,
            content: [{ name: 'file', value: 'a.txt', type: FormDataType.File }],
          })}
          bodyText=""
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).jsonataContent).toBe('');
      expect('content' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).contentType).toBe(ContentType.FormData);
    });

    test('leaves an absent contentType absent (no normalization on turn-on)', () => {
      const content = { model: 'gpt-4' };
      const bodyText = JSON.stringify(content, null, 4);

      render(
        <JsonataToggle
          testSuite={createTestSuite({ content })}
          bodyText={bodyText}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect('contentType' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).jsonataContent).toBe(bodyText);
      expect('content' in bodyOfCall(0)).toBe(false);
    });
  });

  describe('turning off', () => {
    test('under JSON contentType, parses the body text into content', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '{ "model": "gpt-4" }' })}
          bodyText='{ "model": "gpt-4" }'
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect('jsonataContent' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).content).toEqual({ model: 'gpt-4' });
      expect(bodyOfCall(0).contentType).toBe(ContentType.JSON);
    });

    test('does not require the body text to be valid JSON, falling back to the type default', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect('jsonataContent' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).content).toEqual({});
      expect(bodyOfCall(0).contentType).toBe(ContentType.JSON);
    });

    test('does not clear JSON editor errors, so Monaco can re-register them', () => {
      const { dispatch } = useSaveValidationContext();

      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(dispatch).not.toHaveBeenCalledWith({ type: ValidationActionType.SetJsonEditor, errors: [] });
    });

    test('under JSON contentType, falls back to the type default for a real JSONata expression', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '$sum(items.price)' })}
          bodyText="$sum(items.price)"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).content).toEqual({});
    });

    test('under form-data contentType, never restores a parseable object expression', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.FormData, jsonataContent: '{ "model": "gpt-4" }' })}
          bodyText='{ "model": "gpt-4" }'
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).content).toEqual([]);
      expect(bodyOfCall(0).contentType).toBe(ContentType.FormData);
    });

    test('under form-data contentType, restores an empty array and drops jsonataContent', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.FormData, jsonataContent: '$sum(items.price)' })}
          bodyText="$sum(items.price)"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect('jsonataContent' in bodyOfCall(0)).toBe(false);
      expect(bodyOfCall(0).content).toEqual([]);
      expect(bodyOfCall(0).contentType).toBe(ContentType.FormData);
    });

    test('with no contentType, normalizes to application/json and yields an empty-object body', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ jsonataContent: '$sum(items.price)' })}
          bodyText="$sum(items.price)"
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).contentType).toBe(ContentType.JSON);
      expect(bodyOfCall(0).content).toEqual({});
      expect('jsonataContent' in bodyOfCall(0)).toBe(false);
    });
  });

  describe('the body text is never transformed by the toggle', () => {
    test('an off/on round trip writes back the same text, character for character', () => {
      const { rerender } = render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      rerender(
        <JsonataToggle
          testSuite={mockOnChangeTestSuite.mock.calls[0][0]}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(JSONATA_EXPRESSION);
      expect('content' in bodyOfCall(1)).toBe(false);
    });

    test('a parseable expression keeps the user formatting rather than being re-serialized', () => {
      const bodyText = '{ "model": "gpt-4" }';

      const { rerender } = render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: bodyText })}
          bodyText={bodyText}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(0).content).toEqual({ model: 'gpt-4' });

      rerender(
        <JsonataToggle
          testSuite={mockOnChangeTestSuite.mock.calls[0][0]}
          bodyText={bodyText}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(bodyText);
    });

    test('text the user edited after turning off is what turning on writes', () => {
      const { rerender } = render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION })}
          bodyText={JSONATA_EXPRESSION}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      const editedText = JSON.stringify({ model: 'gpt-4' }, null, 4);
      rerender(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: { model: 'gpt-4' } })}
          bodyText={editedText}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(editedText);
    });
  });
});
