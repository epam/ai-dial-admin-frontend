import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { FormDataType } from '@/src/models/form-data';
import ContentTypeSelect from '../components/ContentTypeSelect';

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelect: ({ value, onChange, options, prefix }: any) => (
      <select
        role="combobox"
        aria-label={prefix}
        value={Array.isArray(value) ? value[0] : value}
        onChange={(e: any) => onChange(e.target.value)}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  };
});

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite',
  requestTemplate: { urlTemplate: '/api', body: { contentType: ContentType.JSON, content: {} } },
  ...overrides,
});

describe('ContentTypeSelect', () => {
  let mockOnChangeTestSuite: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
  });

  test('renders select with current contentType', () => {
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: ContentType.JSON, content: {} },
      },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(ContentType.JSON);
  });

  test('uses first content type when body.contentType is undefined', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/api', body: { content: {} } },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(ContentType.JSON);
  });

  test('calls onChangeTestSuite with FormData and empty array when switching from JSON to FormData', () => {
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: ContentType.JSON, content: { foo: 'bar' } },
      },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.FormData } });

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(
      expect.objectContaining({
        requestTemplate: expect.objectContaining({
          body: expect.objectContaining({
            contentType: ContentType.FormData,
            content: [],
          }),
        }),
      }),
    );
  });

  test('calls onChangeTestSuite with JSON and empty object when switching from FormData to JSON', () => {
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: {
          contentType: ContentType.FormData,
          content: [{ name: 'field', type: FormDataType.Text, value: 'x' }],
        },
      },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.JSON } });

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(
      expect.objectContaining({
        requestTemplate: expect.objectContaining({
          body: expect.objectContaining({
            contentType: ContentType.JSON,
            content: {},
          }),
        }),
      }),
    );
  });

  test('does not call onChangeTestSuite when selecting the same contentType', () => {
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: ContentType.JSON, content: {} },
      },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.JSON } });

    expect(mockOnChangeTestSuite).not.toHaveBeenCalled();
  });

  test('stores current content in temp map when switching type and restores it when switching back', () => {
    const jsonContent = { key: 'value' };
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: ContentType.JSON, content: jsonContent },
      },
    });

    const { rerender } = render(
      <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.FormData } });
    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.content).toEqual([]);

    const suiteWithFormData = mockOnChangeTestSuite.mock.calls[0][0];
    mockOnChangeTestSuite.mockClear();
    rerender(<ContentTypeSelect testSuite={suiteWithFormData} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.JSON } });
    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.contentType).toBe(
      ContentType.JSON,
    );
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.content).toEqual(jsonContent);
  });

  test('restores stored FormData content when switching back to FormData after visiting JSON', () => {
    const formDataContent = [
      { name: 'a', type: FormDataType.Text, value: '1' },
      { name: 'b', type: FormDataType.Text, value: '2' },
    ];
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: ContentType.FormData, content: formDataContent },
      },
    });

    const { rerender } = render(
      <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.JSON } });
    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.content).toEqual({});

    const suiteWithJson = mockOnChangeTestSuite.mock.calls[0][0];
    mockOnChangeTestSuite.mockClear();
    rerender(<ContentTypeSelect testSuite={suiteWithJson} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.FormData } });

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.contentType).toBe(
      ContentType.FormData,
    );
    expect(mockOnChangeTestSuite.mock.calls[0][0].requestTemplate?.body?.content).toEqual(formDataContent);
  });

  test('preserves other requestTemplate and testSuite fields when changing contentType', () => {
    const testSuite = createTestSuite({
      requestTemplate: {
        urlTemplate: '/my-url',
        headers: [{ key: 'h', value: 'v' }],
        queryParams: [{ key: 'q', value: 'p' }],
        body: { contentType: ContentType.JSON, content: { x: 1 } },
      },
    });

    render(<ContentTypeSelect testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: ContentType.FormData } });

    const calledSuite = mockOnChangeTestSuite.mock.calls[0][0];
    expect(calledSuite.requestTemplate?.urlTemplate).toBe('/my-url');
    expect(calledSuite.requestTemplate?.headers).toEqual([{ key: 'h', value: 'v' }]);
    expect(calledSuite.requestTemplate?.queryParams).toEqual([{ key: 'q', value: 'p' }]);
    expect(calledSuite.id).toBe('suite-1');
    expect(calledSuite.name).toBe('Test Suite');
  });
});
