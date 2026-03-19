import { createRef } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { FormDataPart, FormDataType } from '@/src/models/form-data';
import BodyTab from '../tabs/BodyTab';

let capturedSetSelectedEntity: (body: Record<string, unknown>) => void;
let capturedChangeContent: (content: FormDataPart[]) => void;

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity, setSelectedEntity, options }: any) => {
    capturedSetSelectedEntity = setSelectedEntity;
    return (
      <div role="application" aria-label="JSON editor">
        <span>{JSON.stringify(entity)}</span>
        <span>{JSON.stringify(options)}</span>
        <button type="button" onClick={() => setSelectedEntity({ edited: true })}>
          Edit
        </button>
      </div>
    );
  },
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/components/FormDataGrid', () => ({
  default: ({ content, changeContent, hideAddButton }: any) => {
    capturedChangeContent = changeContent;
    return (
      <div role="region" aria-label="Form data grid">
        <span>FormData: {JSON.stringify(content)}</span>
        <span data-hide-add={hideAddButton ? 'true' : 'false'} />
        <button type="button" onClick={() => changeContent([{ name: 'x', type: FormDataType.Text, value: 'y' }])}>
          AddPart
        </button>
      </div>
    );
  },
}));

const createTemplate = (overrides?: Partial<TestSuiteRequestTemplate>): TestSuiteRequestTemplate => ({
  urlTemplate: '/api/test',
  body: { contentType: ContentType.JSON, content: { key: 'value' } },
  headers: [],
  queryParams: [],
  ...overrides,
});

describe('BodyTab', () => {
  let mockChangeTemplate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeTemplate = vi.fn();
  });

  describe('JSON content type', () => {
    test('renders JsonEditor when body.contentType is JSON', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.JSON, content: {} } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    });

    test('passes template body content to JsonEditor entity', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.JSON, content: { foo: 'bar' } } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument();
    });

    test('passes empty object to JsonEditor when body content is undefined', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.JSON } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByText('{}')).toBeInTheDocument();
    });

    test('passes stickyScroll disabled option to JsonEditor', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.JSON, content: {} } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByText('{"stickyScroll":{"enabled":false}}')).toBeInTheDocument();
    });

    test('calls changeTemplate with updated body when JsonEditor content changes', () => {
      const template = createTemplate({
        body: { contentType: ContentType.JSON, content: { original: true } },
        urlTemplate: '/url',
        headers: [{ key: 'h', value: 'v' }],
      });

      render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
      expect(mockChangeTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ content: { edited: true } }),
        }),
      );
    });

    test('preserves other template fields when JSON body changes', () => {
      const template = createTemplate({
        urlTemplate: '/my-url',
        headers: [{ key: 'auth', value: 'token' }],
        queryParams: [{ key: 'q', value: 'search' }],
        body: { contentType: ContentType.JSON, content: {} },
      });

      render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

      const calledWith = mockChangeTemplate.mock.calls[0][0];
      expect(calledWith.urlTemplate).toBe('/my-url');
      expect(calledWith.headers).toEqual([{ key: 'auth', value: 'token' }]);
      expect(calledWith.queryParams).toEqual([{ key: 'q', value: 'search' }]);
    });

    test('provides setSelectedEntity callback to JsonEditor', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.JSON, content: {} } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(capturedSetSelectedEntity).toBeInstanceOf(Function);
    });

    test('calls changeTemplate with complex body object when setSelectedEntity is invoked', () => {
      const template = createTemplate({ body: { contentType: ContentType.JSON, content: {} } });

      render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

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
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.FormData, content: [] } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByRole('region', { name: 'Form data grid' })).toBeInTheDocument();
    });

    test('passes hideAddButton to FormDataGrid', () => {
      const { container } = render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.FormData, content: [] } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(container.querySelector('[data-hide-add="true"]')).toBeTruthy();
    });

    test('ref.add appends empty form part', () => {
      const ref = createRef<{ add: () => void }>();
      const template = createTemplate({ body: { contentType: ContentType.FormData, content: [] } });

      render(<BodyTab ref={ref} template={template} changeTemplate={mockChangeTemplate} />);

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
      const ref = createRef<{ add: () => void }>();
      const template = createTemplate({ body: { contentType: ContentType.JSON, content: {} } });

      render(<BodyTab ref={ref} template={template} changeTemplate={mockChangeTemplate} />);

      ref.current?.add();

      expect(mockChangeTemplate).not.toHaveBeenCalled();
    });

    test('passes template body content to FormDataGrid', () => {
      const formContent: FormDataPart[] = [{ name: 'field1', type: FormDataType.Text, value: 'val1' }];
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.FormData, content: formContent } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByText(/FormData:.*field1.*val1/)).toBeInTheDocument();
    });

    test('passes empty array to FormDataGrid when body content is undefined', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.FormData } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(screen.getByText('FormData: []')).toBeInTheDocument();
    });

    test('calls changeTemplate with updated form data when FormDataGrid changeContent is called', () => {
      const template = createTemplate({
        body: { contentType: ContentType.FormData, content: [] },
        urlTemplate: '/api',
      });

      render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

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
      const template = createTemplate({
        urlTemplate: '/path',
        headers: [{ key: 'h', value: 'v' }],
        body: { contentType: ContentType.FormData, content: [] },
      });

      render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);
      fireEvent.click(screen.getByRole('button', { name: 'AddPart' }));

      const calledWith = mockChangeTemplate.mock.calls[0][0];
      expect(calledWith.urlTemplate).toBe('/path');
      expect(calledWith.headers).toEqual([{ key: 'h', value: 'v' }]);
    });

    test('provides changeContent callback to FormDataGrid', () => {
      render(
        <BodyTab
          template={createTemplate({ body: { contentType: ContentType.FormData, content: [] } })}
          changeTemplate={mockChangeTemplate}
        />,
      );

      expect(capturedChangeContent).toBeInstanceOf(Function);
    });
  });
});
