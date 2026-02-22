import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import BodyTab from '../tabs/BodyTab';

let capturedSetSelectedEntity: (body: Record<string, unknown>) => void;

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity, setSelectedEntity, options }: any) => {
    capturedSetSelectedEntity = setSelectedEntity;
    return (
      <div role="code">
        <span>{JSON.stringify(entity)}</span>
        <span>{JSON.stringify(options)}</span>
        <button onClick={() => setSelectedEntity({ edited: true })}>Edit</button>
      </div>
    );
  },
}));

const createTemplate = (overrides?: Partial<TestSuiteRequestTemplate>): TestSuiteRequestTemplate => ({
  urlTemplate: '/api/test',
  body: { key: 'value' },
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

  test('renders JsonEditor', () => {
    render(<BodyTab template={createTemplate()} changeTemplate={mockChangeTemplate} />);

    expect(screen.getByRole('code')).toBeInTheDocument();
  });

  test('passes template body to JsonEditor entity', () => {
    render(<BodyTab template={createTemplate({ body: { foo: 'bar' } })} changeTemplate={mockChangeTemplate} />);

    expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument();
  });

  test('passes empty object when template body is undefined', () => {
    render(<BodyTab template={createTemplate({ body: undefined })} changeTemplate={mockChangeTemplate} />);

    expect(screen.getByText('{}')).toBeInTheDocument();
  });

  test('passes stickyScroll disabled option to JsonEditor', () => {
    render(<BodyTab template={createTemplate()} changeTemplate={mockChangeTemplate} />);

    expect(screen.getByText('{"stickyScroll":{"enabled":false}}')).toBeInTheDocument();
  });

  test('calls changeTemplate with updated body on edit', () => {
    const template = createTemplate({ body: { original: true }, urlTemplate: '/url', headers: [{ key: 'h', value: 'v' }] });

    render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    expect(mockChangeTemplate).toHaveBeenCalledWith({
      ...template,
      body: { edited: true },
    });
  });

  test('preserves other template fields when body changes', () => {
    const template = createTemplate({
      urlTemplate: '/my-url',
      headers: [{ key: 'auth', value: 'token' }],
      queryParams: [{ key: 'q', value: 'search' }],
      body: {},
    });

    render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const calledWith = mockChangeTemplate.mock.calls[0][0];
    expect(calledWith.urlTemplate).toBe('/my-url');
    expect(calledWith.headers).toEqual([{ key: 'auth', value: 'token' }]);
    expect(calledWith.queryParams).toEqual([{ key: 'q', value: 'search' }]);
  });

  test('provides setSelectedEntity callback to JsonEditor', () => {
    render(<BodyTab template={createTemplate()} changeTemplate={mockChangeTemplate} />);

    expect(capturedSetSelectedEntity).toBeInstanceOf(Function);
  });

  test('calls changeTemplate with complex body object', () => {
    const template = createTemplate({ body: {} });

    render(<BodyTab template={template} changeTemplate={mockChangeTemplate} />);

    const complexBody = { nested: { deep: [1, 2, 3] }, flag: true };
    capturedSetSelectedEntity(complexBody);

    expect(mockChangeTemplate).toHaveBeenCalledWith({
      ...template,
      body: complexBody,
    });
  });
});
