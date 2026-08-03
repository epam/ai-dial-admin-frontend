import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { TestSuite, TestSuiteRequestTemplateBody } from '@/src/models/evaluation/test-suite';
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
    test('seeds jsonataContent with "{}" and omits content, leaving contentType untouched', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, content: { model: 'gpt-4' } });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(true);
      expect(body.jsonataContent).toBe('{}');
      expect('content' in body).toBe(false);
      expect(body.contentType).toBe(ContentType.JSON);
    });

    test('leaves an absent contentType absent (no normalization on turn-on)', () => {
      const testSuite = createTestSuite({ content: { model: 'gpt-4' } });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('contentType' in body).toBe(false);
      expect(body.jsonataContent).toBe('{}');
      expect('content' in body).toBe(false);
    });
  });

  describe('turning off', () => {
    test('under JSON contentType, restores an empty object and drops jsonataContent', () => {
      const testSuite = createTestSuite({ contentType: ContentType.JSON, jsonataContent: '$sum(items.price)' });

      render(<JsonataToggle testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
      fireEvent.click(screen.getByRole('switch'));

      const body = mockOnChangeTestSuite.mock.calls[0][0].requestTemplate.body;

      expect('jsonataContent' in body).toBe(false);
      expect(body.content).toEqual({});
      expect(body.contentType).toBe(ContentType.JSON);
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
});
