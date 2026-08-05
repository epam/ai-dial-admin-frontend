import { createRef, RefObject } from 'react';

import { fireEvent, getDefaultNormalizer, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { getBodyText } from '@/src/components/TestSuites/utils/body-content';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { FormDataPart, FormDataType } from '@/src/models/form-data';
import BodyTab, { BodyTabRef } from '../tabs/BodyTab';

let capturedSetSelectedEntity: (body: Record<string, unknown>) => void;
let capturedChangeContent: (content: FormDataPart[]) => void;
let capturedJsonataOnChange: (value: string) => void;
let capturedOnChangeText: (text: string) => void;

vi.mock('@/src/components/Common/JsonataEditor/JsonataEditor', () => ({
  default: ({ value, onChange, options }: any) => {
    capturedJsonataOnChange = onChange;
    return (
      <div role="textbox" aria-label="JSONata editor">
        <span>{JSON.stringify(value)}</span>
        <span>{JSON.stringify(options)}</span>
        <button type="button" onClick={() => onChange('$sum(items.price)')}>
          TypeExpr
        </button>
        <button type="button" onClick={() => onChange('')}>
          ClearExpr
        </button>
      </div>
    );
  },
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity, setSelectedEntity, text, onChangeText, options }: any) => {
    capturedSetSelectedEntity = setSelectedEntity;
    capturedOnChangeText = onChangeText;
    return (
      <div role="application" aria-label="JSON editor">
        <span>{JSON.stringify(entity)}</span>
        <span>Text: {JSON.stringify(text)}</span>
        <span>{JSON.stringify(options)}</span>
        <button type="button" onClick={() => setSelectedEntity({ edited: true })}>
          Edit
        </button>
      </div>
    );
  },
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/components/FormDataGrid', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  const { FormDataType } = await import('@/src/models/form-data');
  const { expect: expectFn } = await import('vitest');
  return {
    default: forwardRef(({ content, changeContent, hideAddButton }: any, ref: any) => {
      expectFn(Array.isArray(content)).toBe(true);
      capturedChangeContent = changeContent;
      useImperativeHandle(ref, () => ({
        add: () => changeContent([...(content || []), { name: '', value: '', type: FormDataType.Text }]),
      }));
      return (
        <div role="region" aria-label="Form data grid">
          <span>FormData: {JSON.stringify(content)}</span>
          <span data-hide-add={hideAddButton ? 'true' : 'false'} />
          <button type="button" onClick={() => changeContent([{ name: 'x', type: FormDataType.Text, value: 'y' }])}>
            AddPart
          </button>
        </div>
      );
    }),
  };
});

const SELECTED_TEST_SUITE_ID = 'suite-1';

const JSONATA_EXPRESSION = [
  '{',
  '    "messages": $append($history, [{ "role": "user", "content": "${{user_message}}" }]),',
  '    "temperature": "${{temperature:0.7}}"',
  '}',
].join('\n');

const exactText = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) };

const mockChangeTemplate = vi.fn();
const mockOnChangeBodyText = vi.fn();

const createTemplate = (overrides?: Partial<TestSuiteRequestTemplate>): TestSuiteRequestTemplate => ({
  urlTemplate: '/api/test',
  body: { contentType: ContentType.JSON, content: { key: 'value' } },
  headers: [],
  queryParams: [],
  ...overrides,
});

interface RenderOptions {
  template?: TestSuiteRequestTemplate;
  bodyText?: string;
  ref?: RefObject<BodyTabRef | null>;
}

const renderBodyTab = ({ template = createTemplate(), bodyText, ref }: RenderOptions = {}) =>
  render(
    <BodyTab
      ref={ref}
      selectedTestSuiteId={SELECTED_TEST_SUITE_ID}
      template={template}
      bodyText={bodyText ?? getBodyText(template.body)}
      onChangeBodyText={mockOnChangeBodyText}
      changeTemplate={mockChangeTemplate}
    />,
  );

describe('BodyTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JSON content type', () => {
    test('renders JsonEditor when body.contentType is JSON', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }) });

      expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    });

    test('passes template body content to JsonEditor entity', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: { foo: 'bar' } } }) });

      expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument();
    });

    test('passes empty object to JsonEditor when body content is undefined', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON } }) });

      expect(screen.getByText('{}')).toBeInTheDocument();
    });

    test('passes stickyScroll disabled option to JsonEditor', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }) });

      expect(screen.getByText('{"stickyScroll":{"enabled":false}}')).toBeInTheDocument();
    });

    test('drives the JsonEditor from bodyText rather than from body.content', () => {
      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }),
        bodyText: JSONATA_EXPRESSION,
      });

      expect(screen.getByText(`Text: ${JSON.stringify(JSONATA_EXPRESSION)}`, exactText)).toBeInTheDocument();
    });

    test('forwards onChangeBodyText to the JsonEditor text buffer', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }) });

      capturedOnChangeText('not json');

      expect(mockOnChangeBodyText).toHaveBeenCalledWith('not json');
    });

    test('a text change alone does not touch body.content', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }) });

      capturedOnChangeText(JSONATA_EXPRESSION);

      expect(mockChangeTemplate).not.toHaveBeenCalled();
    });

    test('calls changeTemplate with updated body when JsonEditor content changes', () => {
      renderBodyTab({
        template: createTemplate({
          body: { contentType: ContentType.JSON, content: { original: true } },
          urlTemplate: '/url',
          headers: [{ key: 'h', value: 'v' }],
        }),
      });

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
      expect(mockChangeTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ content: { edited: true } }),
        }),
      );
    });

    test('preserves other template fields when JSON body changes', () => {
      renderBodyTab({
        template: createTemplate({
          urlTemplate: '/my-url',
          headers: [{ key: 'auth', value: 'token' }],
          queryParams: [{ key: 'q', value: 'search' }],
          body: { contentType: ContentType.JSON, content: {} },
        }),
      });
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

      const calledWith = mockChangeTemplate.mock.calls[0][0];
      expect(calledWith.urlTemplate).toBe('/my-url');
      expect(calledWith.headers).toEqual([{ key: 'auth', value: 'token' }]);
      expect(calledWith.queryParams).toEqual([{ key: 'q', value: 'search' }]);
    });

    test('provides setSelectedEntity callback to JsonEditor', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }) });

      expect(capturedSetSelectedEntity).toBeInstanceOf(Function);
    });

    test('calls changeTemplate with complex body object when setSelectedEntity is invoked', () => {
      const template = createTemplate({ body: { contentType: ContentType.JSON, content: {} } });

      renderBodyTab({ template });

      const complexBody = { nested: { deep: [1, 2, 3] }, flag: true };
      capturedSetSelectedEntity(complexBody);

      expect(mockChangeTemplate).toHaveBeenCalledWith({
        ...template,
        body: { ...template.body, content: complexBody },
      });
    });
  });

  describe('FormData content type', () => {
    test('renders FormDataGrid when body.contentType is FormData', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.FormData, content: [] } }) });

      expect(screen.getByRole('region', { name: 'Form data grid' })).toBeInTheDocument();
    });

    test('passes hideAddButton to FormDataGrid', () => {
      const { container } = renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.FormData, content: [] } }),
      });

      expect(container.querySelector('[data-hide-add="true"]')).toBeTruthy();
    });

    test('ref.add appends empty form part', () => {
      const ref = createRef<BodyTabRef>();
      const template = createTemplate({ body: { contentType: ContentType.FormData, content: [] } });

      renderBodyTab({ template, ref });

      ref.current?.add();

      expect(mockChangeTemplate).toHaveBeenCalledWith({
        ...template,
        body: {
          ...template.body,
          content: [{ name: '', value: '', type: FormDataType.Text }],
        },
      });
    });

    test('ref.add is no-op for JSON body', () => {
      const ref = createRef<BodyTabRef>();

      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, content: {} } }), ref });

      ref.current?.add();

      expect(mockChangeTemplate).not.toHaveBeenCalled();
    });

    test('passes template body content to FormDataGrid', () => {
      const formContent: FormDataPart[] = [{ name: 'field1', type: FormDataType.Text, value: 'val1' }];

      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.FormData, content: formContent } }),
      });

      expect(screen.getByText(/FormData:.*field1.*val1/)).toBeInTheDocument();
    });

    test('passes empty array to FormDataGrid when body content is undefined', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.FormData } }) });

      expect(screen.getByText('FormData: []')).toBeInTheDocument();
    });

    test('calls changeTemplate with updated form data when FormDataGrid changeContent is called', () => {
      const template = createTemplate({
        body: { contentType: ContentType.FormData, content: [] },
        urlTemplate: '/api',
      });

      renderBodyTab({ template });

      fireEvent.click(screen.getByRole('button', { name: 'AddPart' }));

      expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
      expect(mockChangeTemplate).toHaveBeenCalledWith({
        ...template,
        body: {
          ...template.body,
          content: [{ name: 'x', type: FormDataType.Text, value: 'y' }],
        },
      });
    });

    test('preserves other template fields when FormData body changes', () => {
      renderBodyTab({
        template: createTemplate({
          urlTemplate: '/path',
          headers: [{ key: 'h', value: 'v' }],
          body: { contentType: ContentType.FormData, content: [] },
        }),
      });
      fireEvent.click(screen.getByRole('button', { name: 'AddPart' }));

      const calledWith = mockChangeTemplate.mock.calls[0][0];
      expect(calledWith.urlTemplate).toBe('/path');
      expect(calledWith.headers).toEqual([{ key: 'h', value: 'v' }]);
    });

    test('provides changeContent callback to FormDataGrid', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.FormData, content: [] } }) });

      expect(capturedChangeContent).toBeInstanceOf(Function);
    });
  });

  describe('JSONata content type', () => {
    test('renders JsonataEditor when body.jsonataContent is present', () => {
      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: '$sum(x)' } }),
      });

      expect(screen.getByRole('textbox', { name: 'JSONata editor' })).toBeInTheDocument();
      expect(screen.queryByRole('application', { name: 'JSON editor' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Form data grid' })).not.toBeInTheDocument();
    });

    test('seeds the editor from bodyText', () => {
      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: '$sum(items.price)' } }),
      });

      expect(screen.getByText('"$sum(items.price)"')).toBeInTheDocument();
    });

    test('shows a real JSONata expression verbatim, placeholders and all', () => {
      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION } }),
      });

      expect(screen.getByText(JSON.stringify(JSONATA_EXPRESSION), exactText)).toBeInTheDocument();
    });

    test('renders JsonataEditor even when contentType is form-data (stranded-user case)', () => {
      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.FormData, jsonataContent: '$sum(x)' } }),
      });

      expect(screen.getByRole('textbox', { name: 'JSONata editor' })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Form data grid' })).not.toBeInTheDocument();
    });

    test('renders JsonataEditor even when contentType is absent (stranded-user case)', () => {
      renderBodyTab({ template: createTemplate({ body: { jsonataContent: '$sum(x)' } }) });

      expect(screen.getByRole('textbox', { name: 'JSONata editor' })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Form data grid' })).not.toBeInTheDocument();
    });

    test('passes stickyScroll disabled option to JsonataEditor', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: '' } }) });

      expect(screen.getByText('{"stickyScroll":{"enabled":false}}')).toBeInTheDocument();
    });

    test('typing writes jsonataContent, bubbles the text up and leaves content absent', () => {
      renderBodyTab({
        template: createTemplate({
          body: { contentType: ContentType.JSON, jsonataContent: '' },
          urlTemplate: '/url',
          headers: [{ key: 'h', value: 'v' }],
        }),
      });
      fireEvent.click(screen.getByRole('button', { name: 'TypeExpr' }));

      expect(mockOnChangeBodyText).toHaveBeenCalledWith('$sum(items.price)');
      expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
      const calledBody = mockChangeTemplate.mock.calls[0][0].body;

      expect(calledBody.jsonataContent).toBe('$sum(items.price)');
      expect('content' in calledBody).toBe(false);
    });

    test('clearing the editor keeps JSONata mode', () => {
      const template = createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: 'existing' } });

      const { rerender } = renderBodyTab({ template });
      fireEvent.click(screen.getByRole('button', { name: 'ClearExpr' }));

      const clearedBody = mockChangeTemplate.mock.calls[0][0].body;
      expect(clearedBody.jsonataContent).toBe('');

      rerender(
        <BodyTab
          selectedTestSuiteId={SELECTED_TEST_SUITE_ID}
          template={{ ...template, body: clearedBody }}
          bodyText=""
          onChangeBodyText={mockOnChangeBodyText}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByRole('textbox', { name: 'JSONata editor' })).toBeInTheDocument();
    });

    test('preserves other template fields when jsonataContent changes', () => {
      renderBodyTab({
        template: createTemplate({
          urlTemplate: '/my-url',
          headers: [{ key: 'auth', value: 'token' }],
          queryParams: [{ key: 'q', value: 'search' }],
          body: { contentType: ContentType.JSON, jsonataContent: '' },
        }),
      });
      fireEvent.click(screen.getByRole('button', { name: 'TypeExpr' }));

      const calledWith = mockChangeTemplate.mock.calls[0][0];
      expect(calledWith.urlTemplate).toBe('/my-url');
      expect(calledWith.headers).toEqual([{ key: 'auth', value: 'token' }]);
      expect(calledWith.queryParams).toEqual([{ key: 'q', value: 'search' }]);
    });

    test('captures the onChange callback given to JsonataEditor', () => {
      renderBodyTab({ template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: '' } }) });

      expect(capturedJsonataOnChange).toBeInstanceOf(Function);
    });

    test('ref.add is a no-op in JSONata mode', () => {
      const ref = createRef<BodyTabRef>();

      renderBodyTab({
        template: createTemplate({ body: { contentType: ContentType.JSON, jsonataContent: '$sum(x)' } }),
        ref,
      });
      ref.current?.add();

      expect(mockChangeTemplate).not.toHaveBeenCalled();
    });
  });
});
