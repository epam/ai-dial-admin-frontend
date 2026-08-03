import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
  });

  describe('isOn reflects jsonataContent != null', () => {
    test('is off when body is undefined', () => {
      render(<JsonataToggle testSuite={createTestSuite(undefined)} onChangeTestSuite={mockOnChangeTestSuite} />);

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    test('is off when jsonataContent is absent', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: {} })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    test('is on when jsonataContent is the empty string (hand-cleared, not just-toggled-on)', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '' })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    test('is on when jsonataContent is a non-empty string', () => {
      render(
        <JsonataToggle
          testSuite={createTestSuite({ jsonataContent: '$sum(items.price)' })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    test('stays on when a seeded expression is hand-cleared to an empty string', () => {
      const { rerender } = render(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '{}' })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      rerender(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, jsonataContent: '' })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('turning on', () => {
    test('carries authored JSON content into jsonataContent and omits content, leaving contentType untouched', () => {
      const content = { model: 'gpt-4' };
      const testSuite = createTestSuite({ contentType: ContentType.JSON, content });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(true);
      expect(body.jsonataContent).toBe(JSON.stringify(content, null, 4));
      expect('content' in body).toBe(false);
      expect(body.contentType).toBe(ContentType.JSON);
    });

    test('seeds "{}" when there is no content to carry', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect(body.jsonataContent).toBe('{}');
      expect('content' in body).toBe(false);
    });

    test('seeds "{}" when content is an empty object', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, content: {} });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body.jsonataContent).toBe('{}');
    });

    test('does not serialize form-data parts into the expression', () => {
      const testSuite = createTestSuite({
        contentType: ContentType.FormData,
        content: [{ name: 'file', value: 'a.txt', type: FormDataType.File }],
      });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect(body.jsonataContent).toBe('{}');
      expect('content' in body).toBe(false);
      expect(body.contentType).toBe(ContentType.FormData);
    });

    test('leaves an absent contentType absent (no normalization on turn-on)', () => {
      const content = { model: 'gpt-4' };
      const testSuite = createTestSuite({ content });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('contentType' in body).toBe(false);
      expect(body.jsonataContent).toBe(JSON.stringify(content, null, 4));
      expect('content' in body).toBe(false);
    });
  });

  describe('turning off', () => {
    test('under JSON contentType, restores a parseable object expression as content', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: '{ "model": "gpt-4" }' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(false);
      expect(body.content).toEqual({ model: 'gpt-4' });
      expect(body.contentType).toBe(ContentType.JSON);
    });

    test('round-trips authored JSON content through the toggle unchanged', () => {
      const content = { model: 'gpt-4', messages: [{ role: 'user', content: 'hi' }] };
      const testSuite = createTestSuite({ contentType: ContentType.JSON, content });

      const { rerender } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const jsonataSuite = mockOnChangeTestSuite.mock.calls[0][0];
      rerender(<JsonataToggle testSuite={jsonataSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[1][0].requestTemplate.body;

      expect(body.content).toEqual(content);
      expect('jsonataContent' in body).toBe(false);
    });

    test('under JSON contentType, falls back to the type default for a real JSONata expression', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: '$sum(items.price)' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(false);
      expect(body.content).toEqual({});
      expect(body.contentType).toBe(ContentType.JSON);
    });

    test('under form-data contentType, never restores a parseable object expression', () => {
      const testSuite = createTestSuite({ contentType: ContentType.FormData, jsonataContent: '{ "model": "gpt-4" }' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect(body.content).toEqual([]);
      expect(body.contentType).toBe(ContentType.FormData);
    });

    test('under form-data contentType, restores an empty array (not an object) and drops jsonataContent', () => {
      const testSuite = createTestSuite({ contentType: ContentType.FormData, jsonataContent: '$sum(items.price)' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(false);
      expect(body.content).toEqual([]);
      expect(body.contentType).toBe(ContentType.FormData);
    });

    test('with no contentType, normalizes to application/json and yields an empty-object body', () => {
      const testSuite = createTestSuite({ jsonataContent: '$sum(items.price)' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect(body.contentType).toBe(ContentType.JSON);
      expect(body.content).toEqual({});
      expect('jsonataContent' in body).toBe(false);
    });
  });

  describe('in-session round-trip memory', () => {
    const clickSwitch = () => fireEvent.click(screen.getByRole('switch'));
    const bodyOfCall = (index: number) => mockOnChangeTestSuite.mock.calls[index][0].requestTemplate.body;

    test('restores an unparseable expression verbatim after turning off and back on', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION });

      const { rerender } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      clickSwitch();

      expect(bodyOfCall(0).content).toEqual({});

      rerender(
        <JsonataToggle testSuite={mockOnChangeTestSuite.mock.calls[0][0]} onChangeTestSuite={mockOnChangeTestSuite} />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(JSONATA_EXPRESSION);
      expect('content' in bodyOfCall(1)).toBe(false);
    });

    test('serializes JSON content the user authored after turning off, instead of the stashed expression', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION });

      const { rerender } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      clickSwitch();

      const editedContent = { model: 'gpt-4' };
      rerender(
        <JsonataToggle
          testSuite={createTestSuite({ contentType: ContentType.JSON, content: editedContent })}
          onChangeTestSuite={mockOnChangeTestSuite}
        />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(JSON.stringify(editedContent, null, 4));
    });

    test('restores a parseable expression with its original formatting', () => {
      const jsonataContent = '{ "model": "gpt-4" }';
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent });

      const { rerender } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      clickSwitch();

      expect(bodyOfCall(0).content).toEqual({ model: 'gpt-4' });

      rerender(
        <JsonataToggle testSuite={mockOnChangeTestSuite.mock.calls[0][0]} onChangeTestSuite={mockOnChangeTestSuite} />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe(jsonataContent);
    });

    test('re-stashes on every turn-off, so a second round trip also restores verbatim', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION });

      const { rerender } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

      for (let call = 0; call < 3; call++) {
        clickSwitch();
        rerender(
          <JsonataToggle
            testSuite={mockOnChangeTestSuite.mock.calls[call][0]}
            onChangeTestSuite={mockOnChangeTestSuite}
          />,
        );
      }
      clickSwitch();

      expect(bodyOfCall(3).jsonataContent).toBe(JSONATA_EXPRESSION);
    });

    test('does not carry the stash across a remount, seeding from content instead', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION });

      const { unmount } = render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      clickSwitch();
      unmount();

      render(
        <JsonataToggle testSuite={mockOnChangeTestSuite.mock.calls[0][0]} onChangeTestSuite={mockOnChangeTestSuite} />,
      );
      clickSwitch();

      expect(bodyOfCall(1).jsonataContent).toBe('{}');
    });
  });
});
